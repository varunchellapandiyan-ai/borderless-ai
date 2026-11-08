import React, { useState } from 'react';
import {
  Package,
  Plus,
  Sparkles,
  Upload,
  Check,
  AlertCircle,
  Eye,
  Calendar,
  Layers,
  Scale,
  DollarSign,
  Tag,
  ShieldCheck,
  Image as ImageIcon
} from 'lucide-react';
import { Product, ProductPassportExtraction } from '../types';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { SAMPLE_PRODUCT_DESCRIPTION, DEMO_IMAGE_URL } from '../demo/kaveriLoomsData';

interface ProductPassportsProps {
  products: Product[];
  onRefresh: () => void;
}

export const ProductPassports: React.FC<ProductPassportsProps> = ({
  products,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [descriptionInput, setDescriptionInput] = useState(SAMPLE_PRODUCT_DESCRIPTION);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>(DEMO_IMAGE_URL);

  // Extracted or edited fields
  const [extractedData, setExtractedData] = useState<ProductPassportExtraction | null>(null);
  const [sku, setSku] = useState('KL-CUSH-45-ECRU');
  const [unitCostInr, setUnitCostInr] = useState<number>(280);
  const [targetMarginPct, setTargetMarginPct] = useState<number>(35);
  const [minSellingPriceInr, setMinSellingPriceInr] = useState<number>(340);
  const [productionCapacity, setProductionCapacity] = useState<number>(800);
  const [moq, setMoq] = useState<number>(50);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(18);
  const [packagingDetails, setPackagingDetails] = useState('Individual biodegradable sleeve with retail EAN barcode sticker; master carton 50 units (7-ply).');

  // Active viewing product modal
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  const handleExtractWithAI = async () => {
    setIsExtracting(true);
    setErrorMsg(null);
    try {
      const result = await api.extractProductPassport(descriptionInput, selectedImageFile || undefined);
      setExtractedData(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'AI extraction failed');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveConfirmedPassport = async () => {
    if (!extractedData) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await api.createProduct({
        title: extractedData.title,
        sku: sku,
        description: extractedData.description,
        material: extractedData.material,
        color: extractedData.color,
        dimensions: extractedData.dimensions,
        unit_weight_kg: extractedData.unit_weight_kg_estimate || 0.32,
        hs_code: extractedData.suggested_hs_code || '6304.92.00',
        production_capacity_monthly: productionCapacity,
        moq: moq,
        lead_time_days: leadTimeDays,
        unit_cost_inr: unitCostInr,
        target_margin_pct: targetMarginPct,
        min_selling_price_inr: minSellingPriceInr,
        packaging_details: packagingDetails,
        image_url: imagePreviewUrl,
        ai_extracted_metadata: {
          craft_origin_details: extractedData.craft_origin_details,
          packaging_recommendation: extractedData.packaging_recommendation,
          confirmed_by_seller: true,
          confirmed_at: new Date().toISOString(),
        },
      });
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save product passport');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Smart Product Passports</h2>
          <p className="text-xs text-slate-500">
            Structured, evidence-backed export catalog for Indian artisan textiles with verified manufacturing capacity.
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setExtractedData(null);
          }}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all shrink-0"
        >
          <Plus className="w-4 h-4 text-teal-400" />
          <span>New Product Passport</span>
        </button>
      </div>

      {/* Catalog Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((prod) => (
          <div
            key={prod.id}
            className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-sm transition-all flex flex-col"
          >
            {/* Image Banner */}
            <div className="h-48 w-full bg-slate-100 relative overflow-hidden group">
              <img
                src={prod.image_url || DEMO_IMAGE_URL}
                alt={prod.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2.5 left-2.5 bg-slate-950/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded border border-white/20">
                SKU: {prod.sku}
              </div>
              <div className="absolute top-2.5 right-2.5 bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-xs">
                HS: {prod.hs_code}
              </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <EvidenceBadge source="seller-provided" verificationStatus="verified" showSourceOnly />
                <span className="text-[10px] text-slate-400 font-mono">Erode Handloom</span>
              </div>

              <h3 className="font-semibold text-sm text-slate-900 leading-snug mb-2 line-clamp-2">
                {prod.title}
              </h3>

              <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                {prod.description}
              </p>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Material</span>
                  <span className="text-slate-800 text-[11px] truncate block font-sans font-medium">{prod.material}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Dimensions</span>
                  <span className="text-slate-800 text-[11px] block">{prod.dimensions}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Monthly Capacity</span>
                  <span className="text-slate-800 text-[11px] font-bold">{prod.production_capacity_monthly} pcs</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">MOQ / Lead Time</span>
                  <span className="text-slate-800 text-[11px]">{prod.moq} pcs / {prod.lead_time_days}d</span>
                </div>
              </div>

              {/* Financial Boundaries */}
              <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Artisan Base Cost</span>
                  <span className="font-semibold text-slate-900 font-mono">₹{prod.unit_cost_inr.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Min Price Floor</span>
                  <span className="font-bold text-emerald-700 font-mono">₹{prod.min_selling_price_inr.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => setViewProduct(prod)}
                className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Full Passport Specifications</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create Smart Product Passport with Gemini AI Vision */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Smart Product Passport"
        subtitle="Upload craft photo or description. Gemini extracts trade attributes tagged as AI-suggested until you confirm."
        maxWidth="max-w-3xl"
      >
        <div className="space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Input Image & Description */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Artisan Product Image</label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-2 text-center relative overflow-hidden bg-slate-50 flex flex-col items-center justify-center min-h-[160px]">
                {imagePreviewUrl ? (
                  <img src={imagePreviewUrl} alt="Preview" className="w-full h-32 object-cover rounded" />
                ) : (
                  <div className="text-slate-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                    <span className="text-[11px]">Upload craft photo</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Accepts JPG, PNG, WebP (Max 5MB)</p>
            </div>

            <div className="md:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">Artisan Narrative or Specifications</label>
                  <button
                    type="button"
                    onClick={() => setDescriptionInput(SAMPLE_PRODUCT_DESCRIPTION)}
                    className="text-[11px] text-teal-600 hover:underline font-medium"
                  >
                    Paste Demo Cushion Spec
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  placeholder="Describe weaving technique, yarn details, size, and packaging..."
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-sans"
                />
              </div>

              <div className="mt-2">
                <button
                  type="button"
                  disabled={isExtracting || !descriptionInput}
                  onClick={handleExtractWithAI}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <Sparkles className="w-4 h-4 text-teal-200" />
                  <span>{isExtracting ? 'Extracting with Gemini AI...' : 'Run Gemini Structured Extraction'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: AI Extracted Preview (Tagged as AI-Suggested!) */}
          {extractedData && (
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    AI Suggested Attributes (Review & Confirm)
                  </h4>
                </div>
                <EvidenceBadge source="ai-suggested" verificationStatus="pending_confirmation" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Product Title (Export Catalog)</label>
                  <input
                    type="text"
                    value={extractedData.title}
                    onChange={(e) => setExtractedData({ ...extractedData, title: e.target.value })}
                    className="w-full p-2 bg-white rounded border border-slate-300 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Suggested HS Tariff Code</label>
                  <input
                    type="text"
                    value={extractedData.suggested_hs_code}
                    onChange={(e) => setExtractedData({ ...extractedData, suggested_hs_code: e.target.value })}
                    className="w-full p-2 bg-white rounded border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Material & Craft Weave</label>
                  <input
                    type="text"
                    value={extractedData.material}
                    onChange={(e) => setExtractedData({ ...extractedData, material: e.target.value })}
                    className="w-full p-2 bg-white rounded border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Color Palette</label>
                  <input
                    type="text"
                    value={extractedData.color}
                    onChange={(e) => setExtractedData({ ...extractedData, color: e.target.value })}
                    className="w-full p-2 bg-white rounded border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Dimensions</label>
                  <input
                    type="text"
                    value={extractedData.dimensions}
                    onChange={(e) => setExtractedData({ ...extractedData, dimensions: e.target.value })}
                    className="w-full p-2 bg-white rounded border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Unit Weight Estimate (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={extractedData.unit_weight_kg_estimate}
                    onChange={(e) => setExtractedData({ ...extractedData, unit_weight_kg_estimate: parseFloat(e.target.value) || 0.32 })}
                    className="w-full p-2 bg-white rounded border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Export Description</label>
                <textarea
                  rows={2}
                  value={extractedData.description}
                  onChange={(e) => setExtractedData({ ...extractedData, description: e.target.value })}
                  className="w-full p-2 bg-white rounded border border-slate-300 text-xs font-sans"
                />
              </div>

              <div className="bg-white/80 p-2.5 rounded border border-amber-200/80 text-[11px] text-amber-900">
                <strong>Craft Provenance:</strong> {extractedData.craft_origin_details}
              </div>
            </div>
          )}

          {/* Section 3: Verified Seller Cost & Capacity Limits */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Seller Verified Production & Pricing Guardrails
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">SKU Code</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded border border-slate-300 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Unit Mfg Cost (INR)</label>
                <input
                  type="number"
                  value={unitCostInr}
                  onChange={(e) => setUnitCostInr(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 rounded border border-slate-300 font-mono text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Min Selling Price Floor</label>
                <input
                  type="number"
                  value={minSellingPriceInr}
                  onChange={(e) => setMinSellingPriceInr(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-emerald-50 rounded border border-emerald-300 font-mono text-xs font-bold text-emerald-800"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Monthly Capacity</label>
                <input
                  type="number"
                  value={productionCapacity}
                  onChange={(e) => setProductionCapacity(parseInt(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 rounded border border-slate-300 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!extractedData || isSaving}
              onClick={handleSaveConfirmedPassport}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-xs transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Confirm & Save Product Passport'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: View Full Product Passport */}
      {viewProduct && (
        <Modal
          isOpen={!!viewProduct}
          onClose={() => setViewProduct(null)}
          title={`Product Passport: ${viewProduct.title}`}
          subtitle={`SKU: ${viewProduct.sku} | ITC-HS: ${viewProduct.hs_code}`}
        >
          <div className="space-y-4 text-xs">
            <div className="h-56 w-full rounded-lg overflow-hidden bg-slate-100">
              <img src={viewProduct.image_url || DEMO_IMAGE_URL} alt={viewProduct.title} className="w-full h-full object-cover" />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">MATERIAL</span>
                <span className="text-slate-900 font-sans font-semibold">{viewProduct.material}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">DIMENSIONS</span>
                <span className="text-slate-900">{viewProduct.dimensions}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">UNIT WEIGHT</span>
                <span className="text-slate-900">{viewProduct.unit_weight_kg} kg</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">PRODUCTION CAPACITY</span>
                <span className="text-slate-900 font-bold">{viewProduct.production_capacity_monthly} pcs / month</span>
              </div>
            </div>

            <div>
              <h5 className="font-semibold text-slate-800 mb-1">Export Narrative</h5>
              <p className="text-slate-600 text-xs leading-relaxed">{viewProduct.description}</p>
            </div>

            <div>
              <h5 className="font-semibold text-slate-800 mb-1">Export Packaging Standard</h5>
              <p className="text-slate-600 text-xs">{viewProduct.packaging_details}</p>
            </div>

            <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-emerald-900 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold block text-emerald-800">Verified Cost Floor</span>
                <span className="font-mono text-sm font-bold">₹{viewProduct.unit_cost_inr.toFixed(2)} Base &rarr; Min Sale ₹{viewProduct.min_selling_price_inr.toFixed(2)}</span>
              </div>
              <EvidenceBadge source="seller-provided" verificationStatus="verified" showSourceOnly />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
