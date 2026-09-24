function FaceCueLogo({ className = '' }) {
  return (
    <svg
      className={`facecue-logo ${className}`.trim()}
      viewBox="0 0 36 36"
      role="img"
      aria-label="FaceCue logo"
    >
      <circle className="logo-orbit" cx="18" cy="18" r="14" />
      <path className="logo-face" d="M11.5 17.5c0-4.2 2.5-6.5 6.5-6.5s6.5 2.3 6.5 6.5v1.8c0 4.1-2.5 6.7-6.5 6.7s-6.5-2.6-6.5-6.7v-1.8Z" />
      <circle className="logo-eye" cx="15.2" cy="17.5" r="1.2" />
      <circle className="logo-eye" cx="20.8" cy="17.5" r="1.2" />
      <path className="logo-cue" d="M15.2 21.7c1.7 1.2 3.9 1.2 5.6 0" />
      <path className="logo-signal" d="M27.5 8.5c1.6 1.2 2.7 3 3 5.1M29.2 6.2c2.2 1.7 3.7 4.3 4 7.1" />
    </svg>
  );
}

export default FaceCueLogo;
