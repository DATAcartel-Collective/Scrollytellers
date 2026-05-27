export function setupUlbrichtProtocol() {
  if (typeof window === 'undefined') return () => {};

  const SHAKE_THRESHOLD = 25; // m/s^2 roughly
  
  const handleMotion = (event: DeviceMotionEvent) => {
    const acc = event.acceleration;
    if (!acc) return;
    
    // Calculate total acceleration magnitude
    const magnitude = Math.sqrt(
      (acc.x || 0) ** 2 + 
      (acc.y || 0) ** 2 + 
      (acc.z || 0) ** 2
    );

    if (magnitude > SHAKE_THRESHOLD) {
      triggerLockdown();
    }
  };

  const triggerLockdown = () => {
    // In a real app, this would wipe memory, pause DB access, and show a PIN screen
    console.warn("ULBRICHT PROTOCOL TRIGGERED: Device snatched or violently shaken.");
    document.body.innerHTML = '<div style="background:black;position:fixed;inset:0;z-index:99999;display:flex;justify-content:center;align-items:center;color:white;font-family:sans-serif;"><h1>LOCKDOWN</h1></div>';
  };

  window.addEventListener('devicemotion', handleMotion);

  return () => {
    window.removeEventListener('devicemotion', handleMotion);
  };
}
