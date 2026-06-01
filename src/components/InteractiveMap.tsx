import React, { useEffect, useRef, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Eye, Compass, RotateCcw, AlertCircle, Info, Settings, ShieldCheck, Utensils, User, HelpCircle, CheckCircle2 } from 'lucide-react';

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
}

// Check for Google Maps Platform API key in environments
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim() !== '';

// Dark Maps JSON Style for deep dark cyberpunk aesthetics
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#121214" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a90a0" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#2f2f35" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a0a5b5" }],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#b5bbc8" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616773" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#141b18" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4c6b5b" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1c1c1f" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#25252a" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6e7381" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2d2d35" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#3a3a45" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#c8ccd8" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1d1d22" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7a8090" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0c1523" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#36455c" }],
  },
];

// Helper Component: Draw Directions, route lines, bounds matching
function MapFeaturesRenderer({
  location,
  heading = 0,
  isNavigating,
  currentStops,
  pendingOrder
}: {
  location: Location;
  heading: number;
  isNavigating: boolean;
  currentStops: ActiveStop[];
  pendingOrder: any;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  // Calculate and draw lines between Driver and active targets (Route or fallback polylines)
  useEffect(() => {
    if (!map) return;

    // Clear any previous polylines
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    const driverLatLng = { lat: location.latitude, lng: location.longitude };
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(driverLatLng);

    if (isNavigating && currentStops.length > 0) {
      // Draw path towards active stops
      const pathPoints: google.maps.LatLngLiteral[] = [driverLatLng];
      currentStops.forEach(stop => {
        pathPoints.push({ lat: stop.location.latitude, lng: stop.location.longitude });
        bounds.extend({ lat: stop.location.latitude, lng: stop.location.longitude });
      });

      // Try Directions using standard Maps Route solver if Routes library is available
      if (routesLib && routesLib.Route) {
        routesLib.Route.computeRoutes({
          origin: driverLatLng,
          destination: { lat: currentStops[0].location.latitude, lng: currentStops[0].location.longitude },
          travelMode: 'DRIVING',
          fields: ['path', 'viewport'],
        }).then(({ routes }) => {
          if (routes?.[0]) {
            const newPolylines = routes[0].createPolylines();
            newPolylines.forEach(p => {
              p.setOptions({
                strokeColor: '#3b82f6',
                strokeWeight: 5,
                strokeOpacity: 0.9,
              });
              p.setMap(map);
              polylinesRef.current.push(p);
            });

            // Additionally connect further stops if they exist
            if (currentStops.length > 1) {
              for (let i = 0; i < currentStops.length - 1; i++) {
                const nextLine = new google.maps.Polyline({
                  path: [
                    { lat: currentStops[i].location.latitude, lng: currentStops[i].location.longitude },
                    { lat: currentStops[i+1].location.latitude, lng: currentStops[i+1].location.longitude }
                  ],
                  strokeColor: '#22c55e',
                  strokeWeight: 4,
                  strokeOpacity: 0.7,
                  map: map
                });
                polylinesRef.current.push(nextLine);
              }
            }

            if (routes[0].viewport) {
              map.fitBounds(routes[0].viewport);
            } else {
              map.fitBounds(bounds);
            }
          } else {
            drawFallbackLines();
          }
        }).catch(() => {
          drawFallbackLines();
        });
      } else {
        drawFallbackLines();
      }

      function drawFallbackLines() {
        // High fidelity procedural path rendering
        const masterLine = new google.maps.Polyline({
          path: pathPoints,
          strokeColor: '#2563eb',
          strokeOpacity: 0.9,
          strokeWeight: 6,
          geodesic: true,
          map: map
        });
        
        const innerDashedLine = new google.maps.Polyline({
          path: pathPoints,
          strokeColor: '#ffffff',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          geodesic: true,
          map: map
        });

        // Set dash configuration on the inner line
        innerDashedLine.setOptions({
          icons: [{
            icon: {
              path: 'M 0,-1 0,1',
              strokeOpacity: 1,
              scale: 2
            },
            offset: '0',
            repeat: '15px'
          }]
        });

        polylinesRef.current.push(masterLine, innerDashedLine);
        map.fitBounds(bounds);
      }

    } else if (pendingOrder) {
      // Draw preview of a pending order
      const pickupLatLng = { lat: pendingOrder.pickupLocation.latitude, lng: pendingOrder.pickupLocation.longitude };
      const dropoffLatLng = { lat: pendingOrder.customerLocation.latitude, lng: pendingOrder.customerLocation.longitude };

      bounds.extend(pickupLatLng);
      bounds.extend(dropoffLatLng);

      const previewLine = new google.maps.Polyline({
        path: [driverLatLng, pickupLatLng, dropoffLatLng],
        strokeColor: '#f97316',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        geodesic: true,
        map: map
      });

      // Style dashed pending line
      previewLine.setOptions({
        icons: [{
          icon: {
            path: 'M 0,-1 0,1',
            strokeOpacity: 0.9,
            scale: 2
          },
          offset: '0',
          repeat: '12px'
        }]
      });

      polylinesRef.current.push(previewLine);
      
      // Auto fit with nice padding
      map.fitBounds(bounds);
    } else {
      // Simple pan with soft float
      map.panTo(driverLatLng);
    }

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [map, routesLib, location?.latitude, location?.longitude, isNavigating, currentStops, pendingOrder]);

  return null;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  location,
  heading = 0,
  isOnline,
  isNavigating,
  currentStops,
  pendingOrder,
  theme = 'dark',
  otherDrivers = []
}) => {
  const [mapType, setMapType] = useState<'hybrid' | 'roadmap'>('roadmap');
  const [viewAngle, setViewAngle] = useState<'top' | 'tilt'>('top');
  const [manualKeysShowing, setManualKeysShowing] = useState(false);

  if (!hasValidKey) {
    return (
      <div className="w-full h-full min-h-[380px] rounded-[32px] overflow-hidden border border-white/10 bg-[#0d0e12] flex items-center justify-center p-6 sm:p-8 select-none relative">
        <div className="absolute inset-x-0 bottom-0 top-1/2 bg-[linear-gradient(to_bottom,transparent,rgba(59,130,246,0.1))] pointer-events-none" />
        
        {/* Futuristic Grid Line Effects inside the Map Screen */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(90deg, #fff 1px, transparent 1px), linear-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>

        <div className="max-w-md w-full text-center relative z-10 flex flex-col items-center">
          <div className="relative mb-5 flex items-center justify-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full border border-blue-500/20 absolute animate-pulse" />
            <div className="w-12 h-12 bg-blue-500/20 rounded-full border border-blue-500/30 flex items-center justify-center relative">
              <Compass className="text-blue-400 animate-spin" size={24} style={{ animationDuration: '60s' }} />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 flex items-center justify-center text-[8px] font-black text-white">!</span>
            </span>
          </div>

          <h3 className="text-xl font-black tracking-tight text-white uppercase font-display leading-tight">Google Map Link Required</h3>
          <p className="text-xs text-gray-400 font-bold mt-2 leading-relaxed">
            Verify real-time driver routes and visual navigation live on Google Maps. Add an API Key to begin tracing.
          </p>

          <div className="w-full mt-6 text-left space-y-3 bg-[#13141a] p-4 rounded-2xl border border-white/5 shadow-inner">
            <div className="flex items-start gap-2 text-xs">
              <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 font-black flex items-center justify-center shrink-0 border border-blue-500/10">1</span>
              <div>
                <p className="font-extrabold text-blue-400">Get a Free Maps API Key</p>
                <a 
                  href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] bg-blue-500 hover:bg-blue-400 text-white font-black px-2 py-0.5 rounded uppercase mt-1 inline-flex items-center gap-1 transition-colors"
                >
                  Create Key <Eye size={10} />
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs border-t border-white/5 pt-3">
              <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 font-black flex items-center justify-center shrink-0 border border-blue-500/10">2</span>
              <div>
                <p className="font-extrabold text-gray-200">Inject into AI Studio Secrets</p>
                <p className="text-[10px] text-gray-400 leading-normal mt-0.5">
                  Open <span className="text-gray-100 font-bold bg-[#1d1f25] px-1 py-0.5 rounded border border-white/5">Settings ⚙️</span> (top right) → <span className="text-gray-100 font-bold bg-[#1d1f25] px-1 py-0.5 rounded border border-white/5">Secrets</span> → Enter <code className="text-orange-400 font-bold">GOOGLE_MAPS_PLATFORM_KEY</code> as name and paste your Key value!
                </p>
              </div>
            </div>
          </div>

          <p className="text-[9px] font-black text-gray-500 tracking-widest mt-4 uppercase leading-none">
            The driver portal rebuilds automatically inside AI Studio
          </p>
        </div>
      </div>
    );
  }

  const driverLatLng = location ? { lat: location.latitude, lng: location.longitude } : { lat: 51.5074, lng: -0.1278 };

  return (
    <div className="w-full h-full min-h-[380px] rounded-[32px] overflow-hidden border border-white/10 bg-[#0d0e12] flex flex-col relative group select-none">
      <APIProvider apiKey={API_KEY} version="weekly">
        
        {/* Dynamic Map Layers Overlay HUD */}
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
          {/* View Map style toggle */}
          <button
            onClick={() => setMapType(prev => prev === 'roadmap' ? 'hybrid' : 'roadmap')}
            className="h-9 px-3 bg-[#111216]/90 hover:bg-[#18191f] border border-white/10 rounded-xl text-xs font-black text-white flex items-center gap-1.5 transition-all shadow-xl active:scale-90 backdrop-blur-md"
          >
            <Compass size={14} className="text-blue-400" />
            <span className="uppercase tracking-wider">{mapType === 'roadmap' ? 'Road' : 'Satellite'}</span>
          </button>

          {/* Perspective Tilt switch (aesthetic) */}
          <button
            onClick={() => setViewAngle(prev => prev === 'top' ? 'tilt' : 'top')}
            className="w-9 h-9 bg-[#111216]/90 hover:bg-[#18191f] border border-white/10 rounded-xl text-white flex items-center justify-center transition-all shadow-xl active:scale-90 backdrop-blur-md"
            title="Toggle Perspective Tilt"
          >
            <RotateCcw size={14} className={`text-blue-400 transition-transform duration-300 ${viewAngle === 'tilt' ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* Bottom Banner Status Indicants */}
        <div className="absolute bottom-4 left-4 z-40 bg-[#111216]/90 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 px-4 flex items-center gap-3 shadow-2xl">
          <div className="flex -space-x-1.5 overflow-hidden">
            <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-black">
              <ShieldCheck size={10} className="text-white" />
            </span>
          </div>
          <div className="text-left leading-none">
            <p className="text-[9px] font-black text-blue-400 tracking-wider uppercase">Google Maps Live Link</p>
            <p className="text-[10px] font-bold text-gray-300 mt-0.5">Tracking Drivers GPS Core</p>
          </div>
        </div>

        {/* Map View Canvas Core */}
        <div className="w-full h-full relative" style={{ height: '100%', minHeight: '380px' }}>
          <Map
            defaultCenter={driverLatLng}
            defaultZoom={15}
            zoom={isNavigating ? undefined : 15}
            center={isNavigating ? undefined : driverLatLng}
            mapId="COORDINATES_MAP"
            gestureHandling="greedy"
            mapTypeId={mapType}
            disableDefaultUI={true}
            styles={theme === 'dark' ? DARK_MAP_STYLE : undefined}
            tilt={viewAngle === 'tilt' ? 45 : 0}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Dynamic Paths & Route Display Manager */}
            {location && (
              <MapFeaturesRenderer
                location={location}
                heading={heading}
                isNavigating={isNavigating}
                currentStops={currentStops}
                pendingOrder={pendingOrder}
              />
            )}

            {/* Marker 1: Driver Current Location */}
            {location && (
              <AdvancedMarker position={driverLatLng}>
                <div className="relative flex items-center justify-center">
                  {/* Radar ping ring */}
                  <div className="absolute w-12 h-12 bg-blue-500/20 border border-blue-500/40 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                  
                  {/* Car or arrow representation */}
                  <div className="w-9 h-9 bg-blue-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center transition-all" style={{ transform: `rotate(${heading - 45}deg)` }}>
                    <Navigation size={14} className="text-white fill-white translate-y-[-1px] translate-x-[-1px]" />
                  </div>
                </div>
              </AdvancedMarker>
            )}

            {/* Markers for other Online Drivers */}
            {otherDrivers && (() => {
              const seenIds = new Set<string>();
              return otherDrivers.filter(dr => {
                if (!dr || !dr.uid || seenIds.has(dr.uid)) return false;
                seenIds.add(dr.uid);
                return true;
              });
            })().map(dr => {
              if (!dr.latitude || !dr.longitude) return null;
              return (
                <AdvancedMarker 
                  key={`other-driver-${dr.uid}`}
                  position={{ lat: dr.latitude, lng: dr.longitude }}
                >
                  <div className="relative flex flex-col items-center select-none pointer-events-none">
                    {/* Tiny name tooltip of rival rider */}
                    <div className="px-2 py-0.5 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg text-white font-extrabold text-[8px] uppercase tracking-wide shadow-lg whitespace-nowrap mb-1">
                      {dr.name.split(' ')[0]} ⭐{dr.rating.toFixed(1)}
                    </div>
                    
                    {/* Competitive gold/orange vehicle node */}
                    <div className="w-7 h-7 bg-amber-500 rounded-full border-2 border-[#121214] shadow-2xl flex items-center justify-center animate-pulse">
                      <Navigation size={10} className="text-white fill-white translate-y-[-0.5px] translate-x-[-0.5px]" style={{ transform: `rotate(${(dr.heading || 0) - 45}deg)` }} />
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* Marker 2: Active Navigation Stops Pinpoints */}
            {location && isNavigating && currentStops.map((stop, i) => (
              <AdvancedMarker 
                key={`gmap-stop-${stop.orderId}-${stop.type}`} 
                position={{ lat: stop.location.latitude, lng: stop.location.longitude }}
              >
                <div className="flex flex-col items-center">
                  <div className={`px-2.5 py-1 text-[8px] font-black text-white uppercase tracking-wider rounded-lg border shadow-xl relative z-20 ${
                    stop.type === 'pickup' 
                      ? 'bg-blue-600 border-blue-500' 
                      : 'bg-green-600 border-green-500'
                  }`}>
                    {stop.label}
                  </div>
                  
                  <div className={`w-8 h-8 rounded-full border-2 border-[#121214] shadow-2xl flex items-center justify-center mt-1 z-10 ${
                    stop.type === 'pickup' ? 'bg-blue-500' : 'bg-green-500'
                  }`}>
                    {stop.type === 'pickup' ? (
                      <Utensils size={13} className="text-white" />
                    ) : (
                      <MapPin size={13} className="text-white" />
                    )}
                  </div>
                  <div className={`w-0.5 h-3 ${stop.type === 'pickup' ? 'bg-blue-500' : 'bg-green-500'} mt-[-2px]`} />
                </div>
              </AdvancedMarker>
            ))}

            {/* Marker 3: Pending Order Offer Overlay Marker */}
            {location && pendingOrder && (
              <>
                <AdvancedMarker position={{ lat: pendingOrder.pickupLocation.latitude, lng: pendingOrder.pickupLocation.longitude }}>
                  <div className="flex flex-col items-center">
                    <div className="px-2 py-0.5 text-[8px] font-black bg-orange-500 border border-orange-400 text-white rounded-lg shadow-xl uppercase">
                      {pendingOrder.type === 'delivery' ? pendingOrder.restaurantName : 'Offer Pickup'}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-orange-500 border-2 border-white shadow-2xl flex items-center justify-center mt-1">
                      {pendingOrder.type === 'delivery' ? <Utensils size={12} className="text-white" /> : <User size={12} className="text-white" />}
                    </div>
                    <div className="w-0.5 h-3 bg-orange-500 mt-[-2px]" />
                  </div>
                </AdvancedMarker>

                <AdvancedMarker position={{ lat: pendingOrder.customerLocation.latitude, lng: pendingOrder.customerLocation.longitude }}>
                  <div className="flex flex-col items-center">
                    <div className="px-2 py-0.5 text-[8px] font-black bg-emerald-500 border border-emerald-400 text-white rounded-lg shadow-xl uppercase">
                      Offer Destination
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white shadow-2xl flex items-center justify-center mt-1">
                      <MapPin size={12} className="text-white" />
                    </div>
                    <div className="w-0.5 h-3 bg-emerald-500 mt-[-2px]" />
                  </div>
                </AdvancedMarker>
              </>
            )}
          </Map>
        </div>

      </APIProvider>
    </div>
  );
};
