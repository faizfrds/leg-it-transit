import React from 'react';
import type { RouteOption, Location } from '../types';
import PlaceAutocomplete from './PlaceAutocomplete';

interface SidebarProps {
  sourceLocation: Location | null;
  setSourceLocation: (l: Location | null) => void;
  sourceInput: string;
  setSourceInput: (s: string) => void;

  destLocation: Location | null;
  setDestLocation: (l: Location | null) => void;
  destInput: string;
  setDestInput: (s: string) => void;

  walkPreference: number;
  setWalkPreference: (n: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  routes: RouteOption[];
  selectedRouteId: string | null;
  onSelectRoute: (id: string) => void;
  isLoading: boolean;
}

const WalkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="4" r="2"/>
    <path d="M14 7l-2 9-3-3-3 6"/>
    <path d="M10 16l4-1 2 4"/>
  </svg>
);

const TransitIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="16" height="14" rx="2"/>
    <path d="M4 10h16"/>
    <circle cx="8" cy="20" r="1.5"/>
    <circle cx="16" cy="20" r="1.5"/>
    <path d="M8 17v1.5"/>
    <path d="M16 17v1.5"/>
  </svg>
);

const ArrowIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);


const Sidebar: React.FC<SidebarProps> = ({
  sourceLocation, setSourceLocation, sourceInput, setSourceInput,
  destLocation, setDestLocation, destInput, setDestInput,
  walkPreference, setWalkPreference, onSubmit,
  routes, selectedRouteId, onSelectRoute, isLoading
}) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Legit Transit</h1>
        <p>Map routing with walking preferences</p>
      </div>
      
      <div className="sidebar-content">
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="source">Starting point</label>
            <PlaceAutocomplete
              id="source"
              value={sourceInput}
              onChange={setSourceInput}
              onPlaceSelect={setSourceLocation}
              placeholder="E.g., Central Station"
            />
          </div>

          <div className="form-group">
            <label htmlFor="destination">Destination</label>
            <PlaceAutocomplete
              id="destination"
              value={destInput}
              onChange={setDestInput}
              onPlaceSelect={setDestLocation}
              placeholder="E.g., Tech Park"
            />
          </div>

          <div className="form-group slider-container">
            <label htmlFor="walkPref">Walking Preference</label>
            <input 
              id="walkPref"
              type="range" 
              min="0" max="100" 
              value={walkPreference}
              onChange={(e) => setWalkPreference(Number(e.target.value))}
            />
            <div className="slider-labels">
              <span>Less Walking</span>
              <span>Balanced</span>
              <span>More Walking</span>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={!sourceLocation || !destLocation || isLoading}
            style={{ opacity: (!sourceLocation || !destLocation) ? 0.5 : 1 }}
          >
            {isLoading ? (
              <span className="btn-loading">
                <span className="spinner"></span> Calculating...
              </span>
            ) : (
              'Find Best Route'
            )}
          </button>
        </form>

        {routes.length > 0 && (
          <div className="results-container">
            <h3 style={{ fontSize: '1rem', marginTop: '8px' }}>Recommended Routes</h3>
            {routes.map((route, index) => (
              <div 
                key={route.id}
                className={`route-card ${selectedRouteId === route.id ? 'selected' : ''}`}
                onClick={() => onSelectRoute(route.id)}
              >
                {index === 0 && <span className="best-badge">BEST</span>}
                <div className="route-header">
                  <span className="route-time">{route.totalTime}</span>
                  <span className={`route-badge badge-${route.type}`}>{route.label}</span>
                </div>
                
                <div className="route-details">
                  <div className="detail-row">
                    <span className="detail-highlight">{route.transitTime} min</span> transit • <span className="detail-highlight">{route.walkTime} min</span> walk
                  </div>

                  {/* Step summary chips */}
                  {route.steps && route.steps.length > 0 && (
                    <div className="route-steps-summary">
                      {route.steps.map((step, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <span className="step-arrow"><ArrowIcon /></span>}
                          {step.mode === 'TRANSIT' ? (
                            <span
                              className="step-chip step-chip-transit"
                              style={{ 
                                backgroundColor: step.lineColor || '#dc2626',
                                color: '#fff'
                              }}
                              title={`${step.departureStop} → ${step.arrivalStop} (${step.numStops} stops)`}
                            >
                              <TransitIcon />
                              <span>{step.lineName || 'Transit'}</span>
                            </span>
                          ) : (
                            <span className="step-chip step-chip-walk" title={step.duration}>
                              <WalkIcon />
                              <span>{step.duration}</span>
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  <div className="detail-row" style={{ fontSize: '0.8rem' }}>
                    Fare: {route.fare}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
