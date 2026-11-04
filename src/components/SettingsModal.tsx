import React, { useState } from 'react';
import {
  X,
  Upload,
  Trash2,
  MapPin,
  Palette,
  Sliders,
  Check,
  Building,
  RefreshCw,
  Compass,
} from 'lucide-react';
import { StampConfig } from '../types/camera';
import { LOCATION_PRESETS } from '../utils/geo';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stampConfig: StampConfig;
  onSaveConfig: (newConfig: StampConfig) => void;
  onSelectSimulatedLocation: (lat: number, lon: number, alt: number, addr: string) => void;
  onResetToLiveGPS: () => void;
  isSimulatedGPS: boolean;
}

const COLOR_SWATCHES = [
  { name: 'Safety Yellow', hex: '#FFD600' },
  { name: 'Alert Red', hex: '#FF5252' },
  { name: 'Clean White', hex: '#FFFFFF' },
  { name: 'High-Vis Cyan', hex: '#00E5FF' },
  { name: 'Neon Emerald', hex: '#00E676' },
  { name: 'Hazard Orange', hex: '#FF9500' },
];

const WORK_STATUS_OPTIONS = [
  'Initial Inspection',
  'Before Work Started',
  'Work In Progress',
  'Completed / Verified',
  'Punch List Required',
  'Safety Hazard Identified',
  'As-Built Surveyed',
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  stampConfig,
  onSaveConfig,
  onSelectSimulatedLocation,
  onResetToLiveGPS,
  isSimulatedGPS,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'stamp' | 'fields' | 'gps'>('details');
  const [config, setConfig] = useState<StampConfig>(stampConfig);

  if (!isOpen) return null;

  const handleChange = <K extends keyof StampConfig>(key: K, value: StampConfig[K]) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    onSaveConfig(updated);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleChange('customLogoDataUrl', reader.result);
          handleChange('showLogo', true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyPreset = (type: string) => {
    if (type === 'construction') {
      const c: Partial<StampConfig> = {
        companyTitle: 'Apex Construction & Engineering',
        workStatus: 'Completed / Verified',
        stampColor: '#FFD600',
        backgroundStyle: 'translucent',
      };
      const updated = { ...config, ...c };
      setConfig(updated);
      onSaveConfig(updated);
    } else if (type === 'telecom') {
      const c: Partial<StampConfig> = {
        companyTitle: 'GridLine Telecom & Fiber Ops',
        workStatus: 'As-Built Surveyed',
        stampColor: '#00E5FF',
        backgroundStyle: 'solid-dark',
      };
      const updated = { ...config, ...c };
      setConfig(updated);
      onSaveConfig(updated);
    } else if (type === 'safety') {
      const c: Partial<StampConfig> = {
        companyTitle: 'Site Safety & Environmental Audit',
        workStatus: 'Safety Hazard Identified',
        stampColor: '#FF5252',
        backgroundStyle: 'solid-dark',
      };
      const updated = { ...config, ...c };
      setConfig(updated);
      onSaveConfig(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold tracking-wide text-zinc-100 uppercase">
              Field Camera Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/30 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2.5 px-3 text-center transition-colors cursor-pointer border-b-2 ${
              activeTab === 'details'
                ? 'border-amber-400 text-amber-400 bg-zinc-900/80'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Job Info
          </button>
          <button
            onClick={() => setActiveTab('stamp')}
            className={`flex-1 py-2.5 px-3 text-center transition-colors cursor-pointer border-b-2 ${
              activeTab === 'stamp'
                ? 'border-amber-400 text-amber-400 bg-zinc-900/80'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Style & Branding
          </button>
          <button
            onClick={() => setActiveTab('fields')}
            className={`flex-1 py-2.5 px-3 text-center transition-colors cursor-pointer border-b-2 ${
              activeTab === 'fields'
                ? 'border-amber-400 text-amber-400 bg-zinc-900/80'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Watermark Toggles
          </button>
          <button
            onClick={() => setActiveTab('gps')}
            className={`flex-1 py-2.5 px-3 text-center transition-colors cursor-pointer border-b-2 ${
              activeTab === 'gps'
                ? 'border-amber-400 text-amber-400 bg-zinc-900/80'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            GPS / Map
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-zinc-300">
          {/* TAB 1: JOB DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Quick Template Presets */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">
                  Quick Industry Presets
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleApplyPreset('construction')}
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-amber-400 text-[11px]">Construction</div>
                    <div className="text-[10px] text-zinc-400">Yellow · Verified</div>
                  </button>
                  <button
                    onClick={() => handleApplyPreset('telecom')}
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-cyan-400 text-[11px]">Telecom / Utility</div>
                    <div className="text-[10px] text-zinc-400">Cyan · As-Built</div>
                  </button>
                  <button
                    onClick={() => handleApplyPreset('safety')}
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-red-400 text-[11px]">Safety Audit</div>
                    <div className="text-[10px] text-zinc-400">Crimson · Hazard</div>
                  </button>
                </div>
              </div>

              {/* Company / Header */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">
                  Company / Organization Header
                </label>
                <input
                  type="text"
                  value={config.companyTitle}
                  onChange={(e) => handleChange('companyTitle', e.target.value)}
                  placeholder="e.g. Apex Civil Engineering & Survey"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Technician */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">
                  Technician / Inspector Name
                </label>
                <input
                  type="text"
                  value={config.technicianName}
                  onChange={(e) => handleChange('technicianName', e.target.value)}
                  placeholder="e.g. Alex Miller (ID: TECH-99)"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Site ID & Work Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">
                    Site / Job / Work Order #
                  </label>
                  <input
                    type="text"
                    value={config.siteId}
                    onChange={(e) => handleChange('siteId', e.target.value)}
                    placeholder="e.g. SITE-402B"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">
                    Work Status Tag
                  </label>
                  <select
                    value={config.workStatus}
                    onChange={(e) => handleChange('workStatus', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {WORK_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field Observation Notes */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">
                  Field Remarks / Observation Notes
                </label>
                <textarea
                  rows={2}
                  value={config.customNotes}
                  onChange={(e) => handleChange('customNotes', e.target.value)}
                  placeholder="e.g. Foundation poured, rebar spacing inspected and compliant."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* PWA App Installation Card */}
              <PWAInstallButton variant="settings" />
            </div>
          )}

          {/* TAB 2: STAMP APPEARANCE & BRANDING */}
          {activeTab === 'stamp' && (
            <div className="space-y-4">
              {/* Color Selection */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">
                  Stamp Font Color
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.hex}
                      onClick={() => handleChange('stampColor', swatch.hex)}
                      title={swatch.name}
                      className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                        config.stampColor.toLowerCase() === swatch.hex.toLowerCase()
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {config.stampColor.toLowerCase() === swatch.hex.toLowerCase() && (
                        <Check className="w-4 h-4 text-black stroke-[3]" />
                      )}
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 ml-2">
                    <input
                      type="color"
                      value={config.stampColor}
                      onChange={(e) => handleChange('stampColor', e.target.value)}
                      className="w-8 h-8 rounded-full cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-[11px] font-mono text-zinc-400 uppercase">
                      {config.stampColor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Background Style */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">
                  Watermark Box Backdrop
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'transparent', label: 'Transparent (Zero Box)' },
                    { id: 'translucent', label: 'Translucent' },
                    { id: 'solid-dark', label: 'Solid Dark' },
                    { id: 'glass', label: 'Frosted Glass' },
                    { id: 'minimal', label: 'Shadow Only' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => {
                        const styleId = style.id as StampConfig['backgroundStyle'];
                        handleChange('backgroundStyle', styleId);
                        if (styleId === 'transparent' || styleId === 'minimal') {
                          handleChange('backgroundOpacity', 0);
                        } else if ((config.backgroundOpacity ?? 0) === 0) {
                          handleChange('backgroundOpacity', 0.65);
                        }
                      }}
                      className={`py-2 px-2.5 rounded-lg border text-center transition-all cursor-pointer font-medium text-[11px] ${
                        config.backgroundStyle === style.id
                          ? 'border-amber-400 bg-amber-400/15 text-amber-300 font-bold'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Opacity Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-semibold text-zinc-400">
                    Backdrop Transparency / Opacity
                  </label>
                  <span className="font-mono text-[11px] text-amber-400">
                    {Math.round((config.backgroundOpacity ?? 0) * 100)}% {config.backgroundOpacity === 0 ? '(100% Transparent)' : ''}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.backgroundOpacity ?? 0}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    handleChange('backgroundOpacity', val);
                    if (val === 0) {
                      handleChange('backgroundStyle', 'transparent');
                    } else if (config.backgroundStyle === 'transparent') {
                      handleChange('backgroundStyle', 'translucent');
                    }
                  }}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Text Elements Semi-Transparent Backdrop Toggle */}
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <div className="space-y-0.5 pr-2">
                  <div className="font-semibold text-zinc-100 text-[11px] flex items-center gap-1.5">
                    <span>Text Elements Semi-Transparent Backdrop</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300">
                      Legibility
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Draws a rounded-rectangle translucent dark backdrop directly behind text elements for crisp readability.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={Boolean(config.showTextBackdrop ?? true)}
                    onChange={(e) => handleChange('showTextBackdrop', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-amber-400"></div>
                </label>
              </div>

              {/* Stamp Placement */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">
                  Stamp Position on Frame
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'bottom-left', label: 'Bottom Left (Standard)' },
                    { id: 'bottom-right', label: 'Bottom Right' },
                    { id: 'top-left', label: 'Top Left' },
                    { id: 'top-right', label: 'Top Right' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      onClick={() => handleChange('position', pos.id as StampConfig['position'])}
                      className={`py-2 px-2.5 rounded-lg border text-left transition-all cursor-pointer font-medium text-[11px] ${
                        config.position === pos.id
                          ? 'border-amber-400 bg-amber-400/15 text-amber-300 font-bold'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Scale Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-semibold text-zinc-400">
                    Text Size Multiplier
                  </label>
                  <span className="font-mono text-[11px] text-amber-400">
                    {Math.round(config.textScale * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.8"
                  step="0.05"
                  value={config.textScale}
                  onChange={(e) => handleChange('textScale', parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Custom Company Logo Upload */}
              <div className="border border-zinc-800 rounded-xl p-3 bg-zinc-900/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-amber-400" />
                    <span className="text-[11px] font-semibold text-zinc-200">
                      Company Brand Logo
                    </span>
                  </div>
                  {config.customLogoDataUrl && (
                    <button
                      onClick={() => handleChange('customLogoDataUrl', null)}
                      className="text-red-400 hover:text-red-300 text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>

                {config.customLogoDataUrl ? (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-12 bg-black/80 rounded-md border border-zinc-700 flex items-center justify-center p-1">
                      <img
                        src={config.customLogoDataUrl}
                        alt="Logo Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <label className="cursor-pointer text-[11px] text-amber-400 hover:underline">
                      Replace Logo
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="border border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer transition-colors bg-zinc-900/50">
                    <Upload className="w-5 h-5 text-zinc-400 mb-1" />
                    <span className="text-[11px] text-zinc-300 font-medium">
                      Upload Transparent Logo (.PNG / .JPG)
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Appears in top-right of photos & video recordings
                    </span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: WATERMARK TOGGLES */}
          {activeTab === 'fields' && (
            <div className="space-y-2">
              <p className="text-[11px] text-zinc-400 mb-3">
                Toggle which fields are rendered onto the camera frame and baked into captured
                media:
              </p>

              {[
                { key: 'showTextBackdrop', label: 'Semi-Transparent Text Backdrop', desc: 'Rounded-rectangle dark translucent fill behind text elements' },
                { key: 'showMap', label: 'Mini-Map Tile with Target Pin', desc: 'Real-time OSM visual tile' },
                { key: 'showDateTime', label: 'Date, Time & GMT Offset', desc: 'Live precision clock' },
                { key: 'showCoordinates', label: 'GPS Latitude & Longitude', desc: 'Degree coordinates + accuracy (±m)' },
                { key: 'showAltitude', label: 'Elevation / Altitude', desc: 'Meters above sea level' },
                { key: 'showHeading', label: 'Compass Heading & Cardinal', desc: 'Degrees (0-360°) and bearing' },
                { key: 'showAddress', label: 'Reverse-Geocoded Street Address', desc: 'Street, District, City' },
                { key: 'showSiteDetails', label: 'Site / Job ID & Status Tag', desc: 'Project identifiers' },
                { key: 'showTechnician', label: 'Technician / Inspector Name', desc: 'Auditor identity' },
                { key: 'showNotes', label: 'Field Observation Remarks', desc: 'On-site notes string' },
                { key: 'showLogo', label: 'Company Brand Logo', desc: 'Corner emblem watermark' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-900 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-zinc-200 text-[11px]">{item.label}</div>
                    <div className="text-[10px] text-zinc-500">{item.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(config[item.key as keyof StampConfig])}
                    onChange={(e) =>
                      handleChange(item.key as keyof StampConfig, e.target.checked as any)
                    }
                    className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                  />
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: GPS & SIMULATION */}
          {activeTab === 'gps' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-zinc-200 text-xs">GPS Geolocation Source</div>
                  <div className="text-[11px] text-zinc-400">
                    {isSimulatedGPS ? (
                      <span className="text-amber-400 font-semibold">
                        Simulated Preset Active
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">
                        Live Device Hardware GPS
                      </span>
                    )}
                  </div>
                </div>

                {isSimulatedGPS && (
                  <button
                    onClick={onResetToLiveGPS}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset to Live GPS
                  </button>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-2 block">
                  Select Field Simulation Location (Ideal for Testing)
                </label>
                <div className="space-y-2">
                  {LOCATION_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() =>
                        onSelectSimulatedLocation(
                          preset.lat,
                          preset.lon,
                          preset.altitude,
                          preset.address
                        )
                      }
                      className="w-full text-left p-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-start justify-between group cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-zinc-100 group-hover:text-amber-400 transition-colors text-[11px]">
                          {preset.name}
                        </div>
                        <div className="text-[10px] text-zinc-400 line-clamp-1">
                          {preset.address}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                          {preset.lat.toFixed(4)}°, {preset.lon.toFixed(4)}° · Alt: {preset.altitude}m
                        </div>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 group-hover:text-zinc-200">
                        {preset.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900/70 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs tracking-wider uppercase transition-colors shadow-lg cursor-pointer"
          >
            Apply & Return to Camera
          </button>
        </div>
      </div>
    </div>
  );
};
