// Ikon PNG transparan dipakai sebagai mask, sehingga warnanya mengikuti `color` (tema terang/gelap, menu aktif)
export default function Icon({ src, size, className = '' }) {
  const u = `url(${src})`;
  return <span className={'mi ' + className} aria-hidden="true" style={{ WebkitMaskImage: u, maskImage: u, ...(size ? { width: size, height: size } : null) }} />;
}
