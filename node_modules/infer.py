# ddamfn/infer.py
import cv2
import torch
import numpy as np
from torchvision import transforms
from .networks.DDAM import DDAMNet

CLASS_NAMES = ['Neutral', 'Happy', 'Sad', 'Surprise', 'Fear', 'Disgust', 'Angry']

_DST_TEMPLATE = np.array([
    [38.2946, 51.6963], [73.5318, 51.5014],
    [56.0252, 71.7366], [41.5493, 92.3655], [70.7299, 92.2041]
], dtype=np.float32)

class DDAMFNPredictor:
    def __init__(self, checkpoint_path, num_class=7, num_head=2, device=None):
        self.device = device or ('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = DDAMNet(num_class=num_class, num_head=num_head, pretrained=False)
        ckpt = torch.load(checkpoint_path, map_location=self.device)
        state_dict = ckpt['model_state_dict'] if isinstance(ckpt, dict) and 'model_state_dict' in ckpt else ckpt
        state_dict = {k.replace('module.', ''): v for k, v in state_dict.items()}
        self.model.load_state_dict(state_dict)
        self.model.to(self.device).eval()

        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((112, 112)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    def align_face(self, image_bgr, landmarks_5pt):
        from skimage import transform as trans
        tform = trans.SimilarityTransform()
        tform.estimate(landmarks_5pt, _DST_TEMPLATE)
        M = tform.params[0:2, :]
        return cv2.warpAffine(image_bgr, M, (112, 112), borderValue=0.0)

    @torch.no_grad()
    def predict(self, aligned_face_bgr):
        rgb = cv2.cvtColor(aligned_face_bgr, cv2.COLOR_BGR2RGB)
        tensor = self.transform(rgb).unsqueeze(0).to(self.device)
        logits, _, _ = self.model(tensor)
        probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
        pred_idx = int(np.argmax(probs))
        return {
            'label': CLASS_NAMES[pred_idx],
            'confidence': float(probs[pred_idx]),
            'all_probs': dict(zip(CLASS_NAMES, probs.tolist())),
        }