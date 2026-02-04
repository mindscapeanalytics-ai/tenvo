'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Phone, Mail, MapPin, TrendingUp, Edit, Trash2, Plus, Search, Loader2, Sparkles, Eye, AlertTriangle, FileText, CheckCircle, ImagePlus, ShieldCheck, Wallet } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from './DataTable';
import { ExportButton } from './ExportButton';
import { formatCurrency } from '@/lib/currency';
import { getDomainColors } from '@/lib/domainColors';
import { FormError } from '@/components/ui/form-error';
import { getDomainVendorFields, getDomainVendorColumns, normalizeKey } from '@/lib/utils/domainHelpers';
import { DomainFieldRenderer } from './domain/DomainFieldRenderer';
import toast from 'react-hot-toast';
import StakeholderLedger from './StakeholderLedger';
import { CityAutocomplete } from '@/components/CityAutocomplete';
import { validateNTN, formatNTN } from '@/lib/tax/pakistaniTax';
import { formatPakistaniPhone, isValidPakistaniPhone, vendorSchema, validateForm } from '@/lib/validation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from './FileUpload';
import { useBusiness } from '@/lib/context/BusinessContext';
import { Badge } from '@/components/ui/badge';

/**
 * Vendor Manager Component
 * Handles supplier database with Supabase integration
 */
export function VendorManager({ vendors = [], onAdd, onUpdate, onDelete, category = 'retail-shop', businessId }) {
  const { business } = useBusiness();
  const colors = getDomainColors(category);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('identity');
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    ntn: '',
    address: '',
    city: business?.city || '',
    contactPerson: '',
    srn: '',
    payment_terms: '',
    filer_status: 'none',
    opening_balance: 0,
    credit_limit: 0,
    certificate_url: '',
    domain_data: {}
  });

  const [vendorToView, setVendorToView] = useState(null);
  const [vendorToDelete, setVendorToDelete] = useState(null);

  const domainFields = getDomainVendorFields(category);

  const filteredVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const domainColumns = getDomainVendorColumns(category);

  const columns = [
    {
      accessorKey: 'name',
      header: 'Supplier',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ backgroundColor: `${colors.primary}10`, color: colors.primary }}>
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-gray-900 leading-none">{row.original.name}</p>
            <p className="text-xs text-gray-500 mt-1">{row.original.email || 'No email'}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="flex flex-col text-sm text-gray-600 font-medium">
          <span className="flex items-center gap-1.5">
            <Phone className="w-3 h-3" style={{ color: colors.primary }} />
            {row.original.phone}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'outstanding_balance',
      header: 'Payables',
      cell: ({ row }) => (
        <span className={`font-black ${Number(row.original.outstanding_balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(row.original.outstanding_balance || 0, 'PKR')}
        </span>
      ),
    },
    {
      accessorKey: 'city',
      header: 'Location',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-500">
          <MapPin className="w-3 h-3" style={{ color: colors.primary }} />
          {row.original.city || 'Pakistan'}
        </div>
      )
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 rounded-full hover:bg-gray-100"
            onClick={() => setVendorToView(row.original)}
            title="View Details"
          >
            <Eye className="w-4 h-4 text-blue-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 rounded-full hover:bg-gray-100"
            style={{ color: colors.primary }}
            onClick={() => {
              setEditingId(row.original.id);
              setActiveTab('identity');
              setErrors({});
              // Handle nulls to avoid React warnings
              setFormData({
                name: row.original.name || '',
                email: row.original.email || '',
                phone: row.original.phone || '',
                ntn: row.original.ntn || '',
                address: row.original.address || '',
                city: row.original.city || '',
                contactPerson: row.original.domain_data?.contact_person || row.original.contact_person || '',
                srn: row.original.srn || '',
                payment_terms: row.original.payment_terms || '',
                filer_status: row.original.filer_status || 'none',
                credit_limit: row.original.credit_limit || 0,
                outstanding_balance: row.original.outstanding_balance || 0,
                opening_balance: row.original.opening_balance || 0,
                certificate_url: row.original.certificate_url || '',
                domain_data: row.original.domain_data || {}
              });
              setShowAddForm(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
            onClick={() => setVendorToDelete(row.original)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  // Merge dynamic columns: Supplier, Contact, Payables, [Domain], Location, Actions
  const allColumns = [
    columns[0], // Supplier
    columns[1], // Contact
    columns[2], // Payables
    ...domainColumns,
    columns[3], // Location
    columns[4], // Actions
  ];

  const handleSave = async () => {
    const validation = validateForm(vendorSchema, formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error('Please resolve missing fields');
      // Tab switching logic for errors
      if (activeTab === 'identity' && ['ntn', 'srn', 'credit_limit', 'payment_terms'].some(k => validation.errors[k])) {
        setActiveTab('tax');
      }
      return;
    }

    setIsLoading(true);
    try {
      if (editingId) {
        await onUpdate?.({ ...formData, id: editingId });
      } else {
        await onAdd?.(formData);
      }
      setFormData({ name: '', email: '', phone: '', ntn: '', address: '', city: '', filer_status: 'none', opening_balance: 0, credit_limit: 0, certificate_url: '', domain_data: {} });
      setEditingId(null);
      setErrors({});
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving vendor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      ntn: '',
      address: '',
      city: business?.city || '',
      contactPerson: '',
      srn: '',
      payment_terms: '',
      filer_status: 'none',
      opening_balance: 0,
      credit_limit: 0,
      certificate_url: '',
      domain_data: {}
    });
    setErrors({});
    setActiveTab('identity');
    setShowAddForm(true);
  };

  const handleFillDemo = () => {
    const isTextile = category.includes('textile');
    const isPharmacy = category === 'pharmacy';
    const isFMCG = category === 'fmcg';

    const companies = [
      'Al-Noor Trading Co.', 'Indus Logistics PK', 'Habib & Sons',
      'Zubair Chemicals', 'Standard Industrial Corp', 'Premier Supplies Ltd'
    ];

    const textileMills = [
      'Gul Ahmed Textile Mills', 'Sapphire Textile', 'Lucky Textile Mills',
      'Nishat Mills Ltd', 'Al-Karam Textile', 'Yunus Textile'
    ];

    const pharmaDist = [
      'Sami Pharmaceuticals', 'Getz Pharma Distribution', 'Abbott Logistics',
      'GSK Supply Chain', 'RG Pharma'
    ];

    const cities = ['Karachi', 'Lahore', 'Faisalabad', 'Gujranwala', 'Sialkot', 'Multan'];
    const addresses = [
      'Plot # 45, Sector 15, Korangi Industrial Area',
      'Suit 402, Business Avenue, Main Shahrah-e-Faisal',
      'Gully # 3, Montgomery Road, near Railway Station',
      'Phase 2, Sundar Industrial Estate',
      'Plot 12-C, Small Industrial Estate',
      'Floor 2, Textile Plaza, I.I Chundrigar Road'
    ];

    const selectedName = isTextile
      ? textileMills[Math.floor(Math.random() * textileMills.length)]
      : (isPharmacy ? pharmaDist[Math.floor(Math.random() * pharmaDist.length)] : companies[Math.floor(Math.random() * companies.length)]);

    const firstNames = ['Haris', 'Ahmed', 'Zeeshan', 'Kamran', 'Mustafa', 'Imran'];
    const lastNames = ['Khan', 'Sheikh', 'Mughal', 'Ali', 'Ahmed'];

    const demoData = {
      name: selectedName,
      contactPerson: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      phone: '+92 21 ' + (Math.floor(Math.random() * 899999) + 100000), // Regional format
      email: `sales@${selectedName.toLowerCase().replace(/[^a-z0-9]/g, '')}.pk`,
      ntn: (Math.floor(Math.random() * 8999999) + 1000000) + '-' + Math.floor(Math.random() * 9),
      srn: '12-00-' + (Math.floor(Math.random() * 8999999) + 1000000) + '-0',
      address: addresses[Math.floor(Math.random() * addresses.length)],
      city: cities[Math.floor(Math.random() * cities.length)],
      payment_terms: ['Net 15', 'COD', 'Net 30', 'Net 7'][Math.floor(Math.random() * 4)],
      filer_status: Math.random() > 0.3 ? 'active' : 'inactive',
      credit_limit: (Math.floor(Math.random() * 10) + 1) * 100000,
      domain_data: {
        millname: isTextile ? selectedName : '',
        quality_grade: 'A+',
      }
    };

    setFormData(prev => ({ ...prev, ...demoData }));
    toast.success(`Generated: ${selectedName}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Vendor Network</h2>
          <p className="text-gray-500 font-medium">Manage your supply chain and trade credit</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={filteredVendors}
            filename="vendors"
            columns={columns}
            title="Suppliers Report"
          />
          <Button onClick={handleOpenAdd} className="text-white font-black shadow-lg rounded-xl px-6" style={{ backgroundColor: colors.primary, boxShadow: `0 8px 16px -4px ${colors.primary}40` }}>
            <Plus className="w-4 h-4 mr-2" />
            Onboard Supplier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-md bg-white">
          <CardContent className="pt-6">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Active Vendors</p>
            <p className="text-2xl font-black text-gray-900">{vendors.length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-white">
          <CardContent className="pt-6">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total Payables</p>
            <p className="text-2xl font-black text-red-600">
              {formatCurrency(vendors.reduce((s, v) => s + (Number(v.outstanding_balance) || 0), 0), 'PKR')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-wine/5 shadow-xl bg-white/50 backdrop-blur-md">
        <CardHeader className="pb-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-wine w-4 h-4 transition-colors" />
            <Input
              placeholder="Search by company name or NTN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-white border-gray-100 focus:border-wine/30 rounded-xl"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable category={category} data={filteredVendors} columns={allColumns} />
        </CardContent>
      </Card>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-2xl shadow-2xl animate-in slide-in-from-bottom-5 max-h-[90vh] overflow-hidden flex flex-col" style={{ border: `1px solid ${colors.primary}20`, borderRadius: '24px' }}>
            <CardHeader className="flex-shrink-0" style={{ backgroundColor: `${colors.primary}05`, borderBottom: `1px solid ${colors.primary}10` }}>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2" style={{ color: colors.primary }}>
                  <Building2 className="w-5 h-5" />
                  {editingId ? 'Update Supplier Details' : 'Register New Supplier'}
                  {!editingId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFillDemo}
                      className="ml-2 h-7 px-2 text-[10px] font-black uppercase tracking-tighter border-wine/20 text-wine rounded-lg bg-wine/5 hover:bg-wine/10 transition-colors"
                    >
                      <Sparkles className="w-3 h-3 mr-1" /> Magic Fill
                    </Button>
                  )}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)}>
                  <span className="sr-only">Close</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              <CardDescription className="text-wine/60 font-medium">Add to your business procurement network with full tax details</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6 overflow-y-auto flex-grow px-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8 bg-gray-100/50 p-1 rounded-xl">
                  <TabsTrigger value="identity" className="relative rounded-lg data-[state=active]:bg-white data-[state=active]:text-wine data-[state=active]:shadow-sm">
                    Identity
                    {['name', 'phone', 'email'].some(k => errors[k]) && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="tax" className="relative rounded-lg data-[state=active]:bg-white data-[state=active]:text-wine data-[state=active]:shadow-sm">
                    Tax & Finance
                    {['ntn', 'srn', 'credit_limit'].some(k => errors[k]) && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="attachments" className="relative rounded-lg data-[state=active]:bg-white data-[state=active]:text-wine data-[state=active]:shadow-sm">
                    Attachments
                  </TabsTrigger>
                  <TabsTrigger value="domain" className="relative rounded-lg data-[state=active]:bg-white data-[state=active]:text-wine data-[state=active]:shadow-sm text-xs">
                    Expert Logic
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="identity" className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest after:content-['*'] after:ml-0.5 after:text-red-500">Legal Business Name</Label>
                      <Input
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Allied Distributors"
                        className="h-11 rounded-xl"
                      />
                      {errors.name && <FormError message={errors.name} />}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Principal Contact</Label>
                      <Input
                        value={formData.contactPerson || ''}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        placeholder="Manager Name"
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest after:content-['*'] after:ml-0.5 after:text-red-500">Official Phone</Label>
                      <Input
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: formatPakistaniPhone(e.target.value) })}
                        placeholder="+92 300 1234567"
                        className="h-11 rounded-xl"
                      />
                      {errors.phone && <FormError message={errors.phone} />}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Business Email</Label>
                      <Input
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="sales@allied.pk"
                        className="h-11 rounded-xl"
                      />
                      {errors.email && <FormError message={errors.email} />}
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Head Office Address</Label>
                      <Input
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Warehouse/Office location"
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <CityAutocomplete
                        value={formData.city}
                        onChange={(val) => setFormData({ ...formData, city: val })}
                        required={false}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tax" className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-gray-50/50 p-6 rounded-3xl border border-dashed border-gray-200">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      FBR Compliance Profile
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">NTN Number</Label>
                        <Input
                          value={formData.ntn || ''}
                          onChange={(e) => setFormData({ ...formData, ntn: e.target.value })}
                          placeholder="1234567-8"
                          className="h-11 rounded-xl font-mono text-sm"
                        />
                        {errors.ntn && <FormError message={errors.ntn} />}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">SRN Holder</Label>
                        <Input
                          value={formData.srn || ''}
                          onChange={(e) => setFormData({ ...formData, srn: e.target.value })}
                          placeholder="12-34-5678-910-11"
                          className="h-11 rounded-xl font-mono text-sm"
                        />
                        {errors.srn && <FormError message={errors.srn} />}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Filer Status</Label>
                        <select
                          className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-wine/20 font-bold"
                          value={formData.filer_status || 'none'}
                          onChange={(e) => setFormData({ ...formData, filer_status: e.target.value })}
                          style={{ color: formData.filer_status === 'active' ? '#10b981' : (formData.filer_status === 'inactive' ? '#ef4444' : '#6b7280') }}
                        >
                          <option value="none">Choose Status</option>
                          <option value="active">Active Filer</option>
                          <option value="inactive">Non-Filer</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-wine/5 p-6 rounded-3xl border border-wine/10">
                    <h4 className="text-xs font-black text-wine uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Trade Credit & Terms
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Payment Cycle</Label>
                        <select
                          className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-wine/20"
                          value={formData.payment_terms || ''}
                          onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                        >
                          <option value="">Standard Terms</option>
                          <option value="Advanced">Advanced (100%)</option>
                          <option value="COD">Cash on Delivery</option>
                          <option value="Net 7">Net 7 Days</option>
                          <option value="Net 15">Net 15 Days</option>
                          <option value="Net 30">Net 30 Days</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Credit Limit</Label>
                        <Input
                          type="number"
                          value={formData.credit_limit || 0}
                          onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                          placeholder="Maximum allowable credit"
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Opening Balance (Owed to Supplier)</Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rs.</span>
                          <Input
                            type="number"
                            value={formData.opening_balance || 0}
                            onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                            placeholder="Initial credit position"
                            className="h-11 pl-12 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="attachments" className="space-y-6 animate-in fade-in duration-300">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-wine/5 text-wine">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Supplier Credentials</h3>
                        <p className="text-sm text-gray-500">Upload NTN certificates, ISO docs, or trade permits</p>
                      </div>
                    </div>

                    <div className="p-8 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                      <FileUpload
                        accept=".pdf,image/*"
                        maxSize={5}
                        onFileSelect={(file) => {
                          toast.success('Document attached: ' + (file?.name || 'File'));
                          if (file) setFormData({ ...formData, certificate_url: file.name });
                        }}
                      />
                    </div>

                    {formData.certificate_url && (
                      <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                          <span className="text-sm font-semibold text-emerald-700 truncate max-w-[300px]">{formData.certificate_url}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => setFormData({ ...formData, certificate_url: '' })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="domain" className="space-y-6 animate-in fade-in duration-300">
                  {domainFields.length > 0 ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-lg bg-wine/5" style={{ color: colors.primary }}>
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Domain Specialized Data</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-gray-50/50 border border-gray-100">
                        {domainFields.map(field => {
                          const key = normalizeKey(field);
                          return (
                            <DomainFieldRenderer
                              key={field}
                              field={key}
                              value={formData.domain_data?.[key] || ''}
                              onChange={(val) => setFormData({
                                ...formData,
                                domain_data: {
                                  ...formData.domain_data,
                                  [key]: val
                                }
                              })}
                              category={category}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                      <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">Standard supplier profile applies to {category}</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 pt-6 border-t font-bold sticky bottom-0 bg-white pb-6 z-10">
                <Button variant="ghost" className="text-gray-400 hover:text-wine rounded-xl px-6" onClick={() => setShowAddForm(false)}>Discard</Button>
                <Button onClick={handleSave} disabled={isLoading} className="text-white px-10 rounded-xl shadow-xl transition-all active:scale-95" style={{ backgroundColor: colors.primary, boxShadow: `0 8px 16px -4px ${colors.primary}40` }}>
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? 'Save Changes' : 'Onboard Supplier')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* View Vendor Dialog */}
      <Dialog open={!!vendorToView} onOpenChange={(open) => !open && setVendorToView(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-400" />
              {vendorToView?.name}
            </DialogTitle>
            <DialogDescription>Supplier Details & History</DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto px-6 pb-6">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100/50 p-1 rounded-xl">
                <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Profile Details</TabsTrigger>
                <TabsTrigger value="ledger" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Ledger / History</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4 py-2 mt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block">Contact Person</label>
                    <p className="font-medium">{vendorToView?.domain_data?.contact_person || vendorToView?.contact_person || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block">City</label>
                    <p className="font-medium">{vendorToView?.city || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block">Phone</label>
                    <p className="font-medium">{vendorToView?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block">NTN</label>
                    <p className="font-medium">{vendorToView?.ntn || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-400 block">Address</label>
                    <p className="font-medium">{vendorToView?.address || 'N/A'}</p>
                  </div>
                </div>

                {vendorToView?.domain_data && Object.keys(vendorToView.domain_data).length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg mt-2 font-bold">
                    <h4 className="text-xs font-bold text-gray-500 mb-2">Domain Data</h4>
                    <div className="text-xs space-y-1">
                      {Object.entries(vendorToView.domain_data).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="capitalize text-gray-500">{k.replace(/_/g, ' ')}:</span>
                          <span className="font-medium">{typeof v === 'object' ? JSON.stringify(v) : v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ledger" className="mt-0 pt-2 min-h-[400px]">
                <StakeholderLedger
                  entityId={vendorToView?.id}
                  entityType="vendor"
                  businessId={businessId}
                  currency="PKR"
                  colors={colors}
                />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!vendorToDelete} onOpenChange={(open) => !open && setVendorToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <span className="font-bold text-gray-900">{vendorToDelete?.name}</span>?
              This will remove them from your active suppliers.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setVendorToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (vendorToDelete) {
                onDelete?.(vendorToDelete.id);
                setVendorToDelete(null);
              }
            }}>
              Remove Supplier
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
