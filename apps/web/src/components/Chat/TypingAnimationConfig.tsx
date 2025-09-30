import React, { useState } from 'react';
import { useTypingAnimationConfig } from '~/hooks/useTypingAnimationConfig';
import { PERFORMANCE_PRESETS, CONTENT_PRESETS, DEVICE_OPTIMIZATIONS } from '~/config/typingAnimation';
import { cn } from '~/utils';

interface TypingAnimationConfigProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const TypingAnimationConfig: React.FC<TypingAnimationConfigProps> = ({
  className = '',
  isOpen = false,
  onClose,
}) => {
  const {
    config,
    updateConfig,
    resetConfig,
    applyPerformancePreset,
    applyContentPreset,
    applyDeviceOptimizations,
    autoOptimize,
    exportConfig,
    importConfig,
    validation,
    performanceMetrics,
    isOptimized,
  } = useTypingAnimationConfig();

  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'presets' | 'performance'>('basic');
  const [importText, setImportText] = useState('');

  if (!isOpen) return null;

  const handleImport = () => {
    if (importConfig(importText)) {
      setImportText('');
      onClose?.();
    }
  };

  return (
    <div className={cn(
      'fixed inset-0 bg-black/50 flex items-center justify-center z-50',
      className
    )}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            🚀 Typing Animation Configuration
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'basic', label: 'Basic', icon: '⚙️' },
            { id: 'advanced', label: 'Advanced', icon: '🚀' },
            { id: 'presets', label: 'Presets', icon: '🎯' },
            { id: 'performance', label: 'Performance', icon: '📊' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Basic Settings */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Basic Timing Controls
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'baseDelay', label: 'Base Delay (ms)', min: 1, max: 50, step: 1 },
                    { key: 'spaceDelay', label: 'Space Delay (ms)', min: 0, max: 20, step: 1 },
                    { key: 'punctuationDelay', label: 'Punctuation Delay (ms)', min: 20, max: 200, step: 10 },
                    { key: 'newlineDelay', label: 'Newline Delay (ms)', min: 50, max: 500, step: 25 },
                    { key: 'codeDelay', label: 'Code Delay (ms)', min: 5, max: 50, step: 5 },
                    { key: 'mathDelay', label: 'Math Delay (ms)', min: 10, max: 100, step: 5 },
                  ].map((setting) => (
                    <div key={setting.key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {setting.label}
                      </label>
                      <input
                        type="range"
                        min={setting.min}
                        max={setting.max}
                        step={setting.step}
                        value={config[setting.key as keyof typeof config] as number}
                        onChange={(e) => updateConfig({ [setting.key]: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{setting.min}ms</span>
                        <span className="font-medium">{config[setting.key as keyof typeof config]}ms</span>
                        <span>{setting.max}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Visual Effects
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.breathingEffect}
                      onChange={(e) => updateConfig({ breathingEffect: e.target.checked })}
                      className="mr-2"
                    />
                    Breathing Effect
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.microInteractions}
                      onChange={(e) => updateConfig({ microInteractions: e.target.checked })}
                      className="mr-2"
                    />
                    Micro-interactions
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.emojiSupport}
                      onChange={(e) => updateConfig({ emojiSupport: e.target.checked })}
                      className="mr-2"
                    />
                    Emoji Support
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Advanced Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.adaptiveSpeed}
                      onChange={(e) => updateConfig({ adaptiveSpeed: e.target.checked })}
                      className="mr-2"
                    />
                    Adaptive Speed
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.highRefreshRate}
                      onChange={(e) => updateConfig({ highRefreshRate: e.target.checked })}
                      className="mr-2"
                    />
                    High Refresh Rate Support
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.predictiveGrouping}
                      onChange={(e) => updateConfig({ predictiveGrouping: e.target.checked })}
                      className="mr-2"
                    />
                    Predictive Character Grouping
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.smartPausing}
                      onChange={(e) => updateConfig({ smartPausing: e.target.checked })}
                      className="mr-2"
                    />
                    Smart Pausing
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Performance Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Group Size
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={8}
                      step={1}
                      value={config.maxGroupSize}
                      onChange={(e) => updateConfig({ maxGroupSize: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="text-center text-sm text-gray-500 mt-1">
                      {config.maxGroupSize} characters
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Breathing Intensity
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={1}
                      value={Math.round(config.breathingIntensity * 1000)}
                      onChange={(e) => updateConfig({ breathingIntensity: parseInt(e.target.value) / 1000 })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="text-center text-sm text-gray-500 mt-1">
                      {Math.round(config.breathingIntensity * 1000)}‰
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Performance Presets
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(PERFORMANCE_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => applyPerformancePreset(key as keyof typeof PERFORMANCE_PRESETS)}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary transition-colors text-left"
                    >
                      <div className="font-medium text-gray-900 dark:text-white capitalize">{key}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Base delay: {preset.baseDelay}ms
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Content Presets
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(CONTENT_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => applyContentPreset(key as keyof typeof CONTENT_PRESETS)}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary transition-colors text-left"
                    >
                      <div className="font-medium text-gray-900 dark:text-white capitalize">{key}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Optimized for {key} content
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Device Optimizations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(DEVICE_OPTIMIZATIONS).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => applyDeviceOptimizations(key as keyof typeof DEVICE_OPTIMIZATIONS)}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary transition-colors text-left"
                    >
                      <div className="font-medium text-gray-900 dark:text-white capitalize">{key}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Optimized for {key} devices
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={autoOptimize}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  🚀 Auto-Optimize for Current Device
                </button>
                <button
                  onClick={resetConfig}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          )}

          {/* Performance */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-500">Typing Speed</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {performanceMetrics.estimatedTypingSpeed} chars/sec
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-500">Smoothness Score</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {performanceMetrics.smoothnessScore}/100
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-500">Memory Efficiency</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {performanceMetrics.memoryEfficiency}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-500">Device Optimization</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {performanceMetrics.deviceOptimization}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Import/Export Configuration
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Export Current Configuration
                    </label>
                    <button
                      onClick={() => navigator.clipboard.writeText(exportConfig())}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      📋 Copy to Clipboard
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Import Configuration
                    </label>
                    <textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder="Paste configuration JSON here..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      rows={4}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleImport}
                        disabled={!importText.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Import
                      </button>
                      <button
                        onClick={() => setImportText('')}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {!validation.isValid && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="text-sm font-medium text-red-800 dark:text-red-200">
                    Configuration Errors:
                  </div>
                  <ul className="mt-2 text-sm text-red-700 dark:text-red-300">
                    {validation.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TypingAnimationConfig;
