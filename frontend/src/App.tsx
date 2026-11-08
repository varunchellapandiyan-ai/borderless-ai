import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DemoBanner } from './components/DemoBanner';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { ProductPassports } from './pages/ProductPassports';
import { BuyerEnquiries } from './pages/BuyerEnquiries';
import { DealIntelligence } from './pages/DealIntelligence';
import { Quotations } from './pages/Quotations';
import { AINegotiation } from './pages/AINegotiation';
import { PayPalCheckout } from './pages/PayPalCheckout';
import { ExportReadiness } from './pages/ExportReadiness';
import { Settings } from './pages/Settings';
import { api } from './api/client';
import {
  SellerProfile,
  Product,
  BuyerEnquiry,
  DealIntelligenceSummary,
  Quotation,
  ExportReadinessData,
  DashboardStats,
  ActivityLog,
} from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [seller, setSeller] = useState<SellerProfile | undefined>();
  const [products, setProducts] = useState<Product[]>([]);
  const [enquiries, setEnquiries] = useState<BuyerEnquiry[]>([]);
  const [activeEnquiryId, setActiveEnquiryId] = useState<string>('enq_german_01');
  const [dealSummary, setDealSummary] = useState<DealIntelligenceSummary | undefined>();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [activeQuotationId, setActiveQuotationId] = useState<string>('quote_kaveri_001');
  const [readinessData, setReadinessData] = useState<ExportReadinessData | undefined>();
  const [stats, setStats] = useState<DashboardStats | undefined>();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadAllData = async () => {
    try {
      const [
        sellerData,
        productsData,
        enquiriesData,
        quotationsData,
        readinessRes,
        statsRes,
        logsRes,
      ] = await Promise.all([
        api.getSeller().catch(() => undefined),
        api.getProducts().catch(() => []),
        api.getEnquiries().catch(() => []),
        api.getQuotations().catch(() => []),
        api.getExportReadiness().catch(() => undefined),
        api.getDashboardStats().catch(() => undefined),
        api.getActivityLogs().catch(() => []),
      ]);

      setSeller(sellerData);
      setProducts(productsData);
      setEnquiries(enquiriesData);
      setQuotations(quotationsData);
      setReadinessData(readinessRes);
      setStats(statsRes);
      setActivityLogs(logsRes);

      const enqId = enquiriesData[0]?.id || 'enq_german_01';
      setActiveEnquiryId(enqId);
      const dealRes = await api.getDealIntelligence(enqId).catch(() => undefined);
      setDealSummary(dealRes);

      if (quotationsData.length > 0) {
        setActiveQuotationId(quotationsData[0].id);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSelectEnquiryForDeal = async (enquiryId: string) => {
    setActiveEnquiryId(enquiryId);
    try {
      const dealRes = await api.getDealIntelligence(enquiryId);
      setDealSummary(dealRes);
      setCurrentTab('deal');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartDemoFlow = () => {
    // 3-Minute presentation starts at Smart Product Passport
    setCurrentTab('products');
  };

  const activeEnquiry = enquiries.find((e) => e.id === activeEnquiryId) || enquiries[0];
  const activeProduct = products.find((p) => p.id === activeEnquiry?.product_id) || products[0];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        dealCompleteness={dealSummary?.completeness_percentage || 72}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Demo Context Banner */}
        <DemoBanner systemStatus={stats?.system_status} />

        {/* Global Navbar */}
        <Navbar
          seller={seller}
          onStartDemoFlow={handleStartDemoFlow}
          activeEnquiryTitle={activeEnquiry ? `${activeEnquiry.buyer_name} (${activeEnquiry.buyer_country_code})` : undefined}
        />

        {/* Dynamic Page Router */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-xs text-slate-500">
              <span className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mr-2" />
              Loading BORDERLESS AI export intelligence...
            </div>
          ) : (
            <>
              {currentTab === 'overview' && (
                <OverviewDashboard
                  stats={stats}
                  activityLogs={activityLogs}
                  onNavigate={setCurrentTab}
                />
              )}

              {currentTab === 'products' && (
                <ProductPassports
                  products={products}
                  onRefresh={loadAllData}
                />
              )}

              {currentTab === 'enquiries' && (
                <BuyerEnquiries
                  enquiries={enquiries}
                  products={products}
                  onSelectEnquiryForDeal={handleSelectEnquiryForDeal}
                  onRefresh={loadAllData}
                />
              )}

              {currentTab === 'deal' && (
                <DealIntelligence
                  dealSummary={dealSummary}
                  onNavigateToQuotation={() => setCurrentTab('quotations')}
                  onRefresh={loadAllData}
                />
              )}

              {currentTab === 'quotations' && (
                <Quotations
                  quotations={quotations}
                  activeEnquiry={activeEnquiry}
                  activeProduct={activeProduct}
                  onNavigateToNegotiation={(quoteId) => {
                    setActiveQuotationId(quoteId);
                    setCurrentTab('negotiation');
                  }}
                  onRefresh={loadAllData}
                />
              )}

              {currentTab === 'negotiation' && (
                <AINegotiation
                  quotations={quotations}
                  activeQuotationId={activeQuotationId}
                  onNavigateToPayment={(quoteId) => {
                    setActiveQuotationId(quoteId);
                    setCurrentTab('payments');
                  }}
                  onRefresh={loadAllData}
                />
              )}

              {currentTab === 'payments' && (
                <PayPalCheckout
                  quotations={quotations}
                  activeQuotationId={activeQuotationId}
                  onRefresh={loadAllData}
                />
              )}

              {currentTab === 'readiness' && (
                <ExportReadiness readinessData={readinessData} />
              )}

              {currentTab === 'settings' && (
                <Settings seller={seller} stats={stats} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
