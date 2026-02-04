'use client';

import { useState } from 'react';
import { Plus, Trash2, Settings, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { toast } from 'react-hot-toast';

/**
 * CustomParametersManager Component
 * Manages custom attributes/parameters for products
 * 
 * @param {Object} value - Product object with custom parameters
 * @param {Function} onChange - Change callback
 * @param {string} category - Business category
 */
export function CustomParametersManager({
  value = {},
  onChange,
  category = 'retail-shop',
}) {
  const [customParams, setCustomParams] = useState(value.customParameters || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newParam, setNewParam] = useState({
    key: '',
    label: '',
    type: 'text', // text, number, select, date, boolean
    value: '',
    options: [], // for select type
    required: false,
  });

  // Get domain-specific parameter templates
  const getParameterTemplates = () => {
    const templates = {
      'auto-parts': [
        { key: 'engineType', label: 'Engine Type', type: 'select', options: ['Petrol', 'Diesel', 'Electric', 'Hybrid'] },
        { key: 'fuelType', label: 'Fuel Type', type: 'select', options: ['Petrol', 'Diesel', 'CNG', 'LPG'] },
        { key: 'warrantyYears', label: 'Warranty (Years)', type: 'number' },
      ],
      'furniture': [
        { key: 'material', label: 'Material', type: 'select', options: ['Wood', 'Metal', 'Plastic', 'Fabric', 'Leather'] },
        { key: 'assemblyRequired', label: 'Assembly Required', type: 'boolean' },
        { key: 'weight', label: 'Weight (kg)', type: 'number' },
        { key: 'dimensions', label: 'Dimensions (LxWxH)', type: 'text' },
      ],
      'garments': [
        { key: 'fabric', label: 'Fabric Type', type: 'select', options: ['Cotton', 'Polyester', 'Silk', 'Wool', 'Linen'] },
        { key: 'careInstructions', label: 'Care Instructions', type: 'text' },
        { key: 'origin', label: 'Country of Origin', type: 'text' },
      ],
      'electronics-goods': [
        { key: 'wattage', label: 'Wattage', type: 'number' },
        { key: 'voltage', label: 'Voltage', type: 'number' },
        { key: 'certification', label: 'Certification', type: 'select', options: ['BIS', 'CE', 'FCC', 'ISO'] },
      ],
    };
    return templates[category] || [];
  };

  const addParameter = () => {
    if (!newParam.key || !newParam.label) {
      toast.error('Key and Label are required');
      return;
    }

    // Check for duplicate keys
    if (customParams.some(p => p.key === newParam.key)) {
      toast.error('Parameter with this key already exists');
      return;
    }

    const param = {
      ...newParam,
      id: Date.now(),
    };

    const updated = [...customParams, param];
    setCustomParams(updated);
    onChange({ ...value, customParameters: updated });

    // Reset form
    setNewParam({
      key: '',
      label: '',
      type: 'text',
      value: '',
      options: [],
      required: false,
    });
    setShowAddForm(false);
  };

  const removeParameter = (id) => {
    if (confirm('Are you sure you want to remove this parameter?')) {
      const updated = customParams.filter(p => p.id !== id);
      setCustomParams(updated);
      onChange({ ...value, customParameters: updated });
    }
  };

  const updateParameterValue = (id, value) => {
    const updated = customParams.map(p =>
      p.id === id ? { ...p, value } : p
    );
    setCustomParams(updated);
    onChange({ ...value, customParameters: updated });
  };

  const templates = getParameterTemplates();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">Custom Parameters</h4>
          <p className="text-sm text-gray-500">Add custom attributes specific to your products</p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Parameter
        </Button>
      </div>

      {/* Quick Add Templates */}
      {templates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {templates
            .filter(t => !customParams.some(p => p.key === t.key))
            .map((template) => (
              <Button
                key={template.key}
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewParam({
                    ...template,
                    value: template.type === 'boolean' ? false : '',
                  });
                  setShowAddForm(true);
                }}
              >
                <Plus className="w-3 h-3 mr-1" />
                {template.label}
              </Button>
            ))}
        </div>
      )}

      {/* Add Parameter Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Custom Parameter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Parameter Key *</Label>
                <Input
                  value={newParam.key}
                  onChange={(e) => setNewParam({ ...newParam, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="e.g., material_type"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Display Label *</Label>
                <Input
                  value={newParam.label}
                  onChange={(e) => setNewParam({ ...newParam, label: e.target.value })}
                  placeholder="e.g., Material Type"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <select
                  value={newParam.type}
                  onChange={(e) => setNewParam({ ...newParam, type: e.target.value, value: '', options: [] })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  required
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="select">Select (Dropdown)</option>
                  <option value="date">Date</option>
                  <option value="boolean">Boolean (Yes/No)</option>
                </select>
              </div>
              {newParam.type === 'select' && (
                <div className="space-y-2">
                  <Label>Options (comma-separated)</Label>
                  <Input
                    value={newParam.options.join(', ')}
                    onChange={(e) => setNewParam({
                      ...newParam,
                      options: e.target.value.split(',').map(o => o.trim()).filter(o => o),
                    })}
                    placeholder="e.g., Red, Blue, Green"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="required"
                checked={newParam.required}
                onChange={(e) => setNewParam({ ...newParam, required: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="required" className="font-normal">Required</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={addParameter} disabled={!newParam.key || !newParam.label}>
                <Plus className="w-4 h-4 mr-2" />
                Add Parameter
              </Button>
              <Button variant="outline" onClick={() => { setShowAddForm(false); setNewParam({ key: '', label: '', type: 'text', value: '', options: [], required: false }); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parameters List */}
      {customParams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Parameters ({customParams.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customParams.map((param) => (
                <div
                  key={param.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="font-medium">{param.label}</Label>
                      {param.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                      <Badge variant="outline" className="text-xs">{param.type}</Badge>
                    </div>
                    <div className="mt-2">
                      {param.type === 'select' ? (
                        <select
                          value={param.value || ''}
                          onChange={(e) => updateParameterValue(param.id, e.target.value)}
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">Select {param.label}</option>
                          {param.options.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : param.type === 'boolean' ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={param.value || false}
                            onChange={(e) => updateParameterValue(param.id, e.target.checked)}
                            className="h-4 w-4"
                          />
                          <Label className="font-normal">{param.value ? 'Yes' : 'No'}</Label>
                        </div>
                      ) : param.type === 'date' ? (
                        <Input
                          type="date"
                          value={param.value || ''}
                          onChange={(e) => updateParameterValue(param.id, e.target.value)}
                        />
                      ) : (
                        <Input
                          type={param.type}
                          value={param.value || ''}
                          onChange={(e) => updateParameterValue(param.id, e.target.value)}
                          placeholder={`Enter ${param.label.toLowerCase()}`}
                        />
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeParameter(param.id)}
                    className="ml-4"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {customParams.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
          <Settings className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No custom parameters added yet.</p>
          <p className="text-sm">Add custom attributes specific to your products.</p>
        </div>
      )}
    </div>
  );
}

