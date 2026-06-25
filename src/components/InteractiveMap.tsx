import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Eye, Compass, RotateCcw, AlertCircle, Info, Settings, ShieldCheck, Utensils, User, HelpCircle, CheckCircle2, ZoomIn, ZoomOut } from 'lucide-react';

interface Location {
  latitude: number;
  longitude: number;
}

interface ActiveStop {
  location: Location;
  label: string;
  type: 'pickup' | 'dropoff';
  orderId: string;
}

export interface OtherDriver {
  uid: string;
  name: string;
  rating: number;
  tier: string;
  isOnline: boolean;
  latitude?: number;
  longitude?: number;
  heading?: number;
  todayEarnings?: number;
  todayDeliveries?: number;
}

export interface InteractiveMapProps {
  location: Location | null;
  heading?: number;
  isOnline: boolean;
  isNavigating: boolean;
  currentStops: ActiveStop[];
  pendingOrder: any;
  theme?: 'light' | 'dark';
  otherDrivers?: OtherDriver[];
  activeBrand?: 'uber' | 'both' | 'bolt';
  useRealGPS?: boolean;
  setUseRealGPS?: (val: boolean) => void;
  activeCityCenter?: Location;
  activeSurgeAreas?: any[];
  onNavigateToSurgeArea?: (area: any) => void;
  routeWaypoints?: Location[];
  zoom?: number;
  setZoom?: (zoom: number) => void;
}

// 1. Custom Driver Icon Constructor using the highly realistic green car design
const getDriverIcon = (heading: number, isOnline?: boolean) => {
  if (isOnline === false) {
    // Elegant white circle compass marker with black navigation arrow inside
    return L.divIcon({
      html: `
        <div id="leaflet-car-marker" class="relative w-12 h-12 flex items-center justify-center">
          <div class="w-10 h-10 bg-white border border-gray-200 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.18)] flex items-center justify-center transition-all duration-300">
            <svg class="w-5 h-5 text-neutral-800 fill-current" viewBox="0 0 24 24" style="transform: rotate(${(heading || 0) - 45}deg); transition: transform 0.3s ease-out">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
            </svg>
          </div>
        </div>
      `,
      className: 'clear-div-icon',
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });
  }

  return L.divIcon({
    html: `
      <div id="leaflet-car-marker" class="relative w-8 h-8 flex items-center justify-center">
        <div class="absolute inset-0 bg-[#13AA52]/45 rounded-full animate-ping opacity-60" style="animation-duration: 2.2s"></div>
        <div class="w-5 h-5 bg-[#13AA52] border-2 border-white rounded-full shadow-md flex items-center justify-center transition-all" style="transform: rotate(${(heading || 0)}deg)">
          <svg class="w-2.5 h-2.5 text-white fill-white" viewBox="0 0 24 24">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
        </div>
      </div>
    `,
    className: 'clear-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

// 2. Other Rival Drivers Icon Builder
const getOtherDriverIcon = (dr: OtherDriver) => {
  const name = dr.name ? dr.name.split(' ')[0] : 'Rider';
  const rating = dr.rating ? dr.rating.toFixed(1) : '4.9';
  const heading = dr.heading || 0;
  return L.divIcon({
    className: '',
    html: `
      <div class="relative flex flex-col items-center select-none pointer-events-none" style="width: 120px; margin-left: -60px; margin-top: -36px;">
        <div class="px-2 py-0.5 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg text-white font-extrabold text-[8px] uppercase tracking-wide shadow-lg whitespace-nowrap mb-1">
          ${name} ⭐${rating}
        </div>
        
        <div class="w-7 h-7 bg-amber-500 rounded-full border-2 border-[#121214] shadow-2xl flex items-center justify-center animate-pulse">
          <svg class="w-3 h-3 text-white fill-current" viewBox="0 0 24 24" style="transform: rotate(${heading - 45}deg);">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [1, 1],
    iconAnchor: [0, 0]
  });
};

// 3. Active Stop Icon Builder
const getStopIcon = (stop: ActiveStop) => {
  const isPickup = stop.type === 'pickup';
  const colorClass = isPickup ? 'bg-blue-600 border-blue-500' : 'bg-green-600 border-green-500';
  const bkgClass = isPickup ? 'bg-blue-500' : 'bg-green-500';
  
  const svgIcon = isPickup 
    ? `<svg class="w-3 h-3 text-white fill-current" viewBox="0 0 24 24"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>`
    : `<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`;

  return L.divIcon({
    className: '',
    html: `
      <div class="flex flex-col items-center" style="width: 140px; margin-left: -70px; margin-top: -50px;">
        <div class="px-2.5 py-1 text-[8px] font-black text-white uppercase tracking-wider rounded-lg border shadow-xl relative z-20 ${colorClass}">
          ${stop.label}
        </div>
        
        <div class="w-8 h-8 rounded-full border-2 border-[#121214] shadow-2xl flex items-center justify-center mt-1 z-10 ${bkgClass}">
          ${svgIcon}
        </div>
        <div class="w-0.5 h-3 ${isPickup ? 'bg-blue-500' : 'bg-green-500'} mt-[-2px]" />
      </div>
    `,
    iconSize: [1, 1],
    iconAnchor: [0, 0]
  });
};

// 4. Offer Pending Alert Icon Constructor
const getPendingOfferIcon = (type: 'pickup' | 'dest', order: any) => {
  const isPickup = type === 'pickup';
  const label = isPickup 
    ? (order.type === 'delivery' ? order.restaurantName : 'Offer Pickup')
    : 'Offer Destination';
  const bgClass = isPickup ? 'bg-orange-500' : 'bg-emerald-500';
  const borderClass = isPickup ? 'border-orange-400' : 'border-emerald-400';
  
  const svgIcon = isPickup
    ? (order.type === 'delivery' 
        ? `<svg class="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>`
        : `<svg class="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`)
    : `<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`;

  return L.divIcon({
    className: '',
    html: `
      <div class="flex flex-col items-center" style="width: 140px; margin-left: -70px; margin-top: -50px;">
        <div class="px-2 py-0.5 text-[8px] font-black ${bgClass} border ${borderClass} text-white rounded-lg shadow-xl uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
          ${label}
        </div>
        <div class="w-8 h-8 rounded-full ${bgClass} border-2 border-white shadow-2xl flex items-center justify-center mt-1">
          ${svgIcon}
        </div>
        <div class="w-0.5 h-3 ${bgClass} mt-[-2px]" />
      </div>
    `,
    iconSize: [1, 1],
    iconAnchor: [0, 0]
  });
};

// 5. Surge Area Heatmap Overlay Constructor
const getSurgeAreaIcon = (area: any) => {
  let mainGrad = 'rgba(239, 68, 68, 0.22)';
  let subGrad = 'rgba(249, 115, 22, 0.06)';
  let centerGrad = 'rgba(239, 68, 68, 0.35)';
  let edgeGrad = 'rgba(220, 38, 38, 0.08)';

  if (area.periodId === 'breakfast') {
    mainGrad = 'rgba(245, 158, 11, 0.25)';
    subGrad = 'rgba(251, 191, 36, 0.08)';
    centerGrad = 'rgba(251, 191, 36, 0.4)';
    edgeGrad = 'rgba(251, 191, 36, 0.1)';
  } else if (area.periodId === 'lunch') {
    mainGrad = 'rgba(249, 115, 22, 0.25)';
    subGrad = 'rgba(217, 119, 6, 0.08)';
    centerGrad = 'rgba(249, 115, 22, 0.4)';
    edgeGrad = 'rgba(217, 119, 6, 0.1)';
  } else if (area.periodId === 'dinner') {
    mainGrad = 'rgba(220, 38, 38, 0.25)';
    subGrad = 'rgba(185, 28, 28, 0.08)';
    centerGrad = 'rgba(220, 38, 38, 0.42)';
    edgeGrad = 'rgba(185, 28, 28, 0.12)';
  } else if (area.periodId === 'offpeak') {
    mainGrad = 'rgba(16, 185, 129, 0.15)';
    subGrad = 'rgba(45, 212, 191, 0.05)';
    centerGrad = 'rgba(16, 185, 129, 0.25)';
    edgeGrad = 'rgba(45, 212, 191, 0.06)';
  }

  const pingBgClass = area.periodId === 'offpeak' ? 'bg-emerald-500' : area.periodId === 'breakfast' ? 'bg-amber-500' : 'bg-orange-500';

  return L.divIcon({
    className: '',
    html: `
      <div class="relative flex flex-col items-center select-none" style="width: 280px; height: 280px; margin-left: -140px; margin-top: -140px;">
        <!-- Neon heat pulse rings nested perfectly -->
        <div class="absolute w-[280px] h-[280px] rounded-full animate-pulse blur-md pointer-events-none" style="background: radial-gradient(circle, ${mainGrad} 0%, ${subGrad} 50%, transparent 100%); animation-duration: 3.5s; top: 0; left: 0;"></div>
        <div class="absolute w-[140px] h-[140px] rounded-full blur-sm pointer-events-none" style="background: radial-gradient(circle, ${centerGrad} 0%, ${edgeGrad} 50%, transparent 100%); top: 70px; left: 70px;"></div>

        <!-- Interactive multi center navigation button -->
        <div class="absolute top-[125px] flex flex-col items-center pointer-events-auto z-40">
          <button class="surge-nav-trigger px-2.5 py-1 bg-black text-white hover:bg-white hover:text-black border border-white/20 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center gap-1.5 transition-all hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto">
            <span class="w-1.5 h-1.5 rounded-full ${pingBgClass} animate-ping shrink-0"></span>
            <span class="font-sans font-black text-[10px] tracking-tight uppercase">${area.multiplier}x Surge</span>
          </button>
          <div class="px-1.5 py-0.5 bg-black/75 rounded-md text-gray-300 font-bold text-[7.5px] uppercase tracking-wider mt-1 border border-white/5 shadow-md">
            ${area.name}
          </div>
        </div>
      </div>
    `,
    iconSize: [280, 280],
    iconAnchor: [140, 140]
  });
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  location,
  heading = 0,
  isOnline,
  isNavigating,
  currentStops,
  pendingOrder,
  theme = 'dark',
  otherDrivers,
  activeBrand = 'uber',
  useRealGPS = false,
  setUseRealGPS,
  activeCityCenter,
  activeSurgeAreas,
  onNavigateToSurgeArea,
  routeWaypoints,
  zoom,
  setZoom
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [viewAngle, setViewAngle] = useState<'top' | 'tilt'>('top');

  // Refs for persistent Leaflet layers
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const otherDriversMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const stopsMarkersRef = useRef<L.Marker[]>([]);
  const surgeAreasMarkersRef = useRef<L.Marker[]>([]);

  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const routePolylineRef = useRef<L.Polyline | null>(null);
  const dashPolylineRef = useRef<L.Polyline | null>(null);

  const pendingOfferMarkerPickupRef = useRef<L.Marker | null>(null);
  const pendingOfferMarkerDestRef = useRef<L.Marker | null>(null);
  const pendingOfferPolylineRef = useRef<L.Polyline | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const startLat = location?.latitude || 51.5074;
    const startLng = location?.longitude || -0.1278;

    const initialZoom = typeof zoom === 'number'
      ? Math.round(12 + (zoom - 0.4) * (6 / 2.6))
      : 15;

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false
    });

    // Beautiful high-fidelity Map Tiles matching Light/Dark theme dynamically
    const tileUrl = theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 20,
      minZoom: 1
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapRef.current = map;

    // Listen to map zoom changes to sync back to parent
    map.on('zoomend', () => {
      const currentLeafletZoom = map.getZoom();
      const newMultiplier = 0.4 + (currentLeafletZoom - 12) * (2.6 / 6);
      setZoom?.(Math.max(0.4, Math.min(3.0, newMultiplier)));
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Bidirectional sync for outer Zoom Controls
  useEffect(() => {
    if (mapRef.current && typeof zoom === 'number') {
      const targetLeafletZoom = Math.round(12 + (zoom - 0.4) * (6 / 2.6));
      if (mapRef.current.getZoom() !== targetLeafletZoom) {
        mapRef.current.setZoom(targetLeafletZoom);
      }
    }
  }, [zoom]);

  // Update Tile Layer URL source dynamically when theme toggles
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    
    const tileUrl = theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    tileLayerRef.current.setUrl(tileUrl);
  }, [theme]);

  // Synchronize dynamic Layers upon prop changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !location) return;

    const driverLatLng = L.latLng(location.latitude, location.longitude);

    // 1. Update/Add Driver Marker
    if (!driverMarkerRef.current) {
      driverMarkerRef.current = L.marker(driverLatLng, { icon: getDriverIcon(heading, isOnline) }).addTo(map);
    } else {
      driverMarkerRef.current.setLatLng(driverLatLng);
      driverMarkerRef.current.setIcon(getDriverIcon(heading, isOnline));
    }

    // 2. Sync rival drivers
    const currentOtherDriverUids = new Set((otherDrivers || []).map(d => d.uid));
    otherDriversMarkersRef.current.forEach((marker, uid) => {
      if (!currentOtherDriverUids.has(uid)) {
        marker.remove();
        otherDriversMarkersRef.current.delete(uid);
      }
    });

    const seenIds = new Set<string>();
    const uniqueOtherDrivers = (otherDrivers || []).filter(dr => {
      if (!dr || !dr.uid || seenIds.has(dr.uid)) return false;
      seenIds.add(dr.uid);
      return true;
    });

    uniqueOtherDrivers.forEach(dr => {
      if (dr.latitude && dr.longitude) {
        const latlng = L.latLng(dr.latitude, dr.longitude);
        let marker = otherDriversMarkersRef.current.get(dr.uid);
        if (!marker) {
          marker = L.marker(latlng, { icon: getOtherDriverIcon(dr) }).addTo(map);
          otherDriversMarkersRef.current.set(dr.uid, marker);
        } else {
          marker.setLatLng(latlng);
          marker.setIcon(getOtherDriverIcon(dr));
        }
      }
    });

    // 3. Sync Navigation Stops & Drawing Routes
    stopsMarkersRef.current.forEach(m => m.remove());
    stopsMarkersRef.current = [];

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }
    if (dashPolylineRef.current) {
      dashPolylineRef.current.remove();
      dashPolylineRef.current = null;
    }

    if (isNavigating && routeWaypoints && routeWaypoints.length > 0) {
      const pathPoints = [driverLatLng, ...routeWaypoints.map(wp => L.latLng(wp.latitude, wp.longitude))];

      currentStops.forEach(st => {
        const stLatLng = L.latLng(st.location.latitude, st.location.longitude);
        const marker = L.marker(stLatLng, { icon: getStopIcon(st) }).addTo(map);
        stopsMarkersRef.current.push(marker);
      });

      routePolylineRef.current = L.polyline(pathPoints, {
        color: '#2563eb',
        weight: 6,
        opacity: 0.9,
        lineJoin: 'round'
      }).addTo(map);

      dashPolylineRef.current = L.polyline(pathPoints, {
        color: '#ffffff',
        weight: 2,
        opacity: 0.8,
        dashArray: '5, 10',
        lineJoin: 'round'
      }).addTo(map);

      // Fit bounds to show route path beautifully only when the route is constructed or recalulated.
      // We check route length and first waypoint to identify recalculations, preventing jumping while moving.
      const bounds = L.latLngBounds(pathPoints);
      const boundsKey = routeWaypoints.length + "_" + (routeWaypoints[0]?.latitude || 0);
      if ((map as any).lastBoundsKey !== boundsKey) {
        (map as any).lastBoundsKey = boundsKey;
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else if (isNavigating && currentStops.length > 0) {
      const stopLatLngs = currentStops.map(s => L.latLng(s.location.latitude, s.location.longitude));
      const pathPoints = [driverLatLng, ...stopLatLngs];

      currentStops.forEach(st => {
        const stLatLng = L.latLng(st.location.latitude, st.location.longitude);
        const marker = L.marker(stLatLng, { icon: getStopIcon(st) }).addTo(map);
        stopsMarkersRef.current.push(marker);
      });

      routePolylineRef.current = L.polyline(pathPoints, {
        color: '#2563eb',
        weight: 6,
        opacity: 0.9,
        lineJoin: 'round'
      }).addTo(map);

      dashPolylineRef.current = L.polyline(pathPoints, {
        color: '#ffffff',
        weight: 2,
        opacity: 0.8,
        dashArray: '5, 10',
        lineJoin: 'round'
      }).addTo(map);

      const bounds = L.latLngBounds(pathPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // 4. Offer Pending Preview Layer
    if (pendingOfferMarkerPickupRef.current) {
      pendingOfferMarkerPickupRef.current.remove();
      pendingOfferMarkerPickupRef.current = null;
    }
    if (pendingOfferMarkerDestRef.current) {
      pendingOfferMarkerDestRef.current.remove();
      pendingOfferMarkerDestRef.current = null;
    }
    if (pendingOfferPolylineRef.current) {
      pendingOfferPolylineRef.current.remove();
      pendingOfferPolylineRef.current = null;
    }

    if (pendingOrder) {
      const pLoc = L.latLng(pendingOrder.pickupLocation.latitude, pendingOrder.pickupLocation.longitude);
      const dLoc = L.latLng(pendingOrder.customerLocation.latitude, pendingOrder.customerLocation.longitude);
      const points = [driverLatLng, pLoc, dLoc];

      pendingOfferMarkerPickupRef.current = L.marker(pLoc, {
        icon: getPendingOfferIcon('pickup', pendingOrder)
      }).addTo(map);

      pendingOfferMarkerDestRef.current = L.marker(dLoc, {
        icon: getPendingOfferIcon('dest', pendingOrder)
      }).addTo(map);

      pendingOfferPolylineRef.current = L.polyline(points, {
        color: '#f97316',
        weight: 4,
        dashArray: '6, 8',
        opacity: 0.8,
        lineJoin: 'round'
      }).addTo(map);

      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // 5. Surge Heatmap Layers
    surgeAreasMarkersRef.current.forEach(m => m.remove());
    surgeAreasMarkersRef.current = [];

    if (isOnline && activeSurgeAreas && activeSurgeAreas.length > 0) {
      const baseCenter = activeCityCenter || location || { latitude: 51.5074, longitude: -0.1278 };
      activeSurgeAreas.forEach(area => {
        const lat = baseCenter.latitude + area.lat;
        const lng = baseCenter.longitude + area.lng;
        const latlng = L.latLng(lat, lng);

        const surgeMarker = L.marker(latlng, { icon: getSurgeAreaIcon(area) }).addTo(map);

        // Bind interactive event handler dynamically
        setTimeout(() => {
          const el = surgeMarker.getElement();
          if (el) {
            const btn = el.querySelector('.surge-nav-trigger');
            if (btn) {
              btn.addEventListener('click', (e) => {
                e.stopPropagation();
                onNavigateToSurgeArea?.(area);
              });
            }
          }
        }, 80);

        surgeAreasMarkersRef.current.push(surgeMarker);
      });
    }

    // 6. Center map camera on driver if static
    if (!isNavigating && !pendingOrder) {
      map.panTo(driverLatLng);
    }

  }, [
    location?.latitude, 
    location?.longitude, 
    heading, 
    otherDrivers, 
    isOnline, 
    isNavigating, 
    currentStops, 
    pendingOrder, 
    activeSurgeAreas, 
    activeBrand,
    routeWaypoints
  ]);

  return (
    <div className="w-full h-full min-h-[380px] rounded-[32px] overflow-hidden border border-white/10 bg-[#0d0e12] flex flex-col relative group select-none">
      
      {/* Absolute HUD Layer Overlays */}
      <div className="absolute top-4 right-4 z-[5500] flex items-center gap-2 pointer-events-auto">
        {/* Toggle Live GPS Button */}
        <button
          onClick={() => setUseRealGPS?.(!useRealGPS)}
          className={`h-9 px-3 border rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xl active:scale-90 backdrop-blur-md cursor-pointer ${
            useRealGPS 
              ? 'bg-emerald-500/90 text-black border-emerald-400' 
              : 'bg-[#111216]/90 border-white/10 text-white hover:bg-[#18191f]'
          }`}
          title="Toggle Simulation vs Real GPS"
        >
          <div className={`w-2 h-2 rounded-full ${useRealGPS ? 'bg-black animate-pulse' : 'bg-gray-400'}`} />
          <span className="uppercase tracking-wider">{useRealGPS ? 'GPS: Real' : 'GPS: Sim'}</span>
        </button>

        {/* Perspective Flip Camera */}
        <button
          onClick={() => setViewAngle(prev => prev === 'top' ? 'tilt' : 'top')}
          className="w-9 h-9 bg-[#111216]/90 border border-white/10 rounded-xl text-white flex items-center justify-center transition-all shadow-xl active:scale-90 backdrop-blur-md cursor-pointer hover:bg-[#18191f]"
          title="Toggle 3D Perspective"
        >
          <RotateCcw size={14} className={`text-blue-400 transition-transform duration-300 ${viewAngle === 'tilt' ? 'rotate-90' : ''}`} />
        </button>

        {/* Custom Zoom Controls */}
        <div className="flex flex-col bg-[#111216]/90 border border-white/10 rounded-xl overflow-hidden shadow-xl backdrop-blur-md z-[5501]">
          <button 
            onClick={() => mapRef.current?.zoomIn()} 
            className="w-9 h-9 flex items-center justify-center text-blue-400 border-b border-white/5 hover:bg-[#18191f] active:scale-90 transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button 
            onClick={() => mapRef.current?.zoomOut()} 
            className="w-9 h-9 flex items-center justify-center text-blue-400 hover:bg-[#18191f] active:scale-90 transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
        </div>
      </div>

      {/* Dispatch Core Brand Banner */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-[#111216]/90 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 px-4 flex items-center gap-3 shadow-2xl pointer-events-none">
        <div className="flex -space-x-1.5 overflow-hidden">
          {activeBrand === 'both' ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full bg-blue-500 border border-black" />
              <span className="w-3.5 h-3.5 rounded-full bg-[#00ca72] border border-black" />
            </>
          ) : (
            <span className={`w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-black ${activeBrand === 'bolt' ? 'bg-[#00ca72]' : 'bg-blue-500'}`}>
              <ShieldCheck size={10} className="text-white" />
            </span>
          )}
        </div>
        <div className="text-left leading-none">
          <p className={`text-[9px] font-black tracking-wider uppercase ${activeBrand === 'bolt' ? 'text-[#00ca72]' : activeBrand === 'both' ? 'text-[#a855f7]' : 'text-blue-400'}`}>
            {activeBrand === 'both' ? 'Dual-Dispatch GPS Core' : activeBrand === 'bolt' ? 'Bolt Driver GPS Core' : 'Uber Driver GPS Core'}
          </p>
          <p className="text-[10px] font-bold text-gray-300 mt-0.5">Tracking Drivers GPS Core</p>
        </div>
      </div>

      {/* Leaflet Map Viewer Canvas Core */}
      <div 
        className="w-full h-full relative overflow-hidden transition-all duration-500 origin-bottom" 
        style={{ 
          height: '100%', 
          minHeight: '380px',
          transform: viewAngle === 'tilt' ? 'perspective(800px) rotateX(25deg) translateY(-12px) scale(1.03)' : 'none',
          boxShadow: viewAngle === 'tilt' ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : 'none'
        }}
      >
        <div ref={mapContainerRef} className="w-full h-full" style={{ width: '100%', height: '100%', outline: 'none' }} />
      </div>

    </div>
  );
};
