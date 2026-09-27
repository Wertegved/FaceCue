import logoUrl from '../assets/facecue-logo.svg';

function FaceCueLogo({ className = '' }) {
  return (
    <img
      src={logoUrl}
      alt="FaceCue logo"
      className={`facecue-logo ${className}`.trim()}
    />
  );
}

export default FaceCueLogo;
