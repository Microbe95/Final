'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axiosClient from '@/lib/axiosClient';
import { apiEndpoints } from '@/lib/axiosClient';
import { useMappingAPI, HSCNMappingResponse } from '@/hooks/useMappingAPI';
import { useProductNames } from '@/hooks/useProductNames';

interface Install {
  id: number;
  install_name: string;
}

interface Product {
  id: number;
  install_id: number;
  product_name: string;
  product_category: string;
  prostart_period: string;
  proend_period: string;
  product_amount: number;
  cncode_total?: string;
  goods_name?: string;
  goods_engname?: string; // 품목영문명 추가
  aggrgoods_name?: string;
  aggrgoods_engname?: string; // 품목군영문명 추가
  product_sell: number;
  product_eusell: number;
  created_at?: string;
  updated_at?: string;
}

interface Process {
  id: number;
  product_id: number;
  process_name: string;
  start_period: string;
  end_period: string;
  created_at?: string;
  updated_at?: string;
}

interface ProductForm {
  product_name: string;
  product_category: string;
  prostart_period: string;
  proend_period: string;
  product_amount: number;
  product_hscode: string; // HS 코드 추가
  cncode_total: string;
  goods_name: string;
  goods_engname: string; // 품목영문명 추가
  aggrgoods_name: string;
  aggrgoods_engname: string; // 품목군영문명 추가
  product_sell: number;
  product_eusell: number;
}

interface ProcessForm {
  process_name: string;
}

export default function InstallProductsPage() {
  const router = useRouter();
  const params = useParams();
  const installId = parseInt(params.id as string);

  const [products, setProducts] = useState<Product[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showProcessFormForProduct, setShowProcessFormForProduct] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [productForm, setProductForm] = useState<ProductForm>({
    product_name: '',
    product_category: '',
    prostart_period: '',
    proend_period: '',
    product_amount: 0,
    product_hscode: '', // HS 코드 초기값 추가
    cncode_total: '',
    goods_name: '',
    goods_engname: '', // 품목영문명 초기값 추가
    aggrgoods_name: '',
    aggrgoods_engname: '', // 품목군영문명 초기값 추가
    product_sell: 0,
    product_eusell: 0
  });

  // HS-CN 매핑 API 훅 사용
  const { lookupByHSCode, loading: mappingLoading } = useMappingAPI();
  const [cnCodeResults, setCnCodeResults] = useState<HSCNMappingResponse[]>([]);
  const [showCnCodeResults, setShowCnCodeResults] = useState(false);

  // 제품명 목록 훅 사용 (Railway DB의 dummy 테이블에서 가져옴)
  const { productNames, loading: productNamesLoading, error: productNamesError, fetchProductNamesByPeriod } = useProductNames();

  // 모달 상태 관리
  const [showHSCodeModal, setShowHSCodeModal] = useState(false);
  const [hsCodeSearchInput, setHsCodeSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<HSCNMappingResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [processForm, setProcessForm] = useState<ProcessForm>({
    process_name: ''
  });

  // 사업장별 제품 목록 조회
  const fetchProducts = async () => {
    try {
      const response = await axiosClient.get(apiEndpoints.cbam.product.list);
      // 현재 사업장의 제품들만 필터링
      const filteredProducts = response.data.filter((product: Product) => product.install_id === installId);
      setProducts(filteredProducts);
    } catch (error: any) {
      console.error('❌ 제품 목록 조회 실패:', error);
    }
  };

  // 제품별 프로세스 목록 조회
  const fetchProcesses = async () => {
    try {
      const response = await axiosClient.get(apiEndpoints.cbam.process.list);
      setProcesses(response.data);
    } catch (error: any) {
      console.error('❌ 프로세스 목록 조회 실패:', error);
    }
  };

  useEffect(() => {
    if (installId) {
      fetchProducts();
      fetchProcesses();
      setIsLoading(false);
    }
  }, [installId]);

  // 기간 변경 시 제품명 목록 업데이트 (useEffect 제거, 수동 호출로 변경)
  // useEffect(() => {
  //   if (productForm.prostart_period && productForm.proend_period) {
  //     console.log('🔄 기간 설정 완료, 제품명 목록 업데이트 시작');
  //     fetchProductNamesByPeriod(productForm.prostart_period, productForm.proend_period);
  //   }
  // }, [productForm.prostart_period, productForm.proend_period, fetchProductNamesByPeriod]);

  // 기간 설정 완료 시 수동으로 제품명 목록 업데이트
  const handlePeriodChange = useCallback((field: 'prostart_period' | 'proend_period', value: string) => {
    const newForm = { ...productForm, [field]: value };
    
    // 두 기간이 모두 설정된 경우에만 제품명 조회
    if (newForm.prostart_period && newForm.proend_period) {
      console.log('🔄 기간 설정 완료, 제품명 목록 업데이트 시작');
      fetchProductNamesByPeriod(newForm.prostart_period, newForm.proend_period);
    }
    
    setProductForm(newForm);
  }, [productForm, fetchProductNamesByPeriod]);

  const handleProductInputChange = (field: keyof ProductForm, value: string | number) => {
    setProductForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProcessInputChange = (field: keyof ProcessForm, value: string) => {
    setProcessForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 제품 폼 초기화
  const resetProductForm = () => {
    setProductForm({
      product_name: '',
      product_category: '',
      prostart_period: '',
      proend_period: '',
      product_amount: 0,
      product_hscode: '',
      cncode_total: '',
      goods_name: '',
      goods_engname: '',
      aggrgoods_name: '',
      aggrgoods_engname: '',
      product_sell: 0,
      product_eusell: 0
    });
    setEditingProduct(null);
    setShowProductForm(false);
  };

  // 제품 수정 모드 시작
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      product_name: product.product_name,
      product_category: product.product_category,
      prostart_period: product.prostart_period,
      proend_period: product.proend_period,
      product_amount: product.product_amount,
      product_hscode: '', // HS 코드는 내부적으로만 사용
      cncode_total: product.cncode_total || '',
      goods_name: product.goods_name || '',
      goods_engname: product.goods_engname || '',
      aggrgoods_name: product.aggrgoods_name || '',
      aggrgoods_engname: product.aggrgoods_engname || '',
      product_sell: product.product_sell,
      product_eusell: product.product_eusell
    });
    setShowProductForm(true);
  };

  // 제품 수정 취소
  const handleCancelEditProduct = () => {
    resetProductForm();
  };

  // HS 코드 실시간 검색 함수
  const handleHSCodeSearch = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // 입력된 HS 코드를 그대로 사용 (패딩하지 않음)
      const results = await lookupByHSCode(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('HS 코드 검색 실패:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // HS 코드 검색 입력 변경 핸들러
  const handleHSCodeSearchInputChange = (value: string) => {
    setHsCodeSearchInput(value);
    // 실시간 검색 (디바운싱 적용)
    const timeoutId = setTimeout(() => {
      handleHSCodeSearch(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  // CN 코드 선택 함수 (모달에서)
  const handleSelectCNCodeFromModal = (result: HSCNMappingResponse) => {
    setProductForm(prev => ({
      ...prev,
      product_hscode: hsCodeSearchInput, // HS 코드는 내부적으로 저장
      cncode_total: result.cncode_total, // CN 코드가 입력 필드에 표시됨
      goods_name: result.goods_name || '',
      goods_engname: result.goods_engname || '', // 품목영문명 저장
      aggrgoods_name: result.aggregoods_name || '',
      aggrgoods_engname: result.aggregoods_engname || '' // 품목군영문명 저장
    }));
    setShowHSCodeModal(false);
    setHsCodeSearchInput('');
    setSearchResults([]);
  };

  // 모달 열기 함수
  const openHSCodeModal = () => {
    setShowHSCodeModal(true);
    setHsCodeSearchInput('');
    setSearchResults([]);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productForm.product_name || !productForm.prostart_period || !productForm.proend_period) {
      setToast({
        message: '필수 필드를 모두 입력해주세요.',
        type: 'error'
      });
      return;
    }

    try {
      // 백엔드 스키마에 맞게 데이터 변환
      const productData = {
        install_id: installId,
        product_name: productForm.product_name,
        product_category: productForm.product_category || '단순제품', // 기본값 설정
        prostart_period: productForm.prostart_period, // date 형식으로 전송
        proend_period: productForm.proend_period, // date 형식으로 전송
        product_amount: parseFloat(productForm.product_amount.toString()) || 0, // float로 변환
        cncode_total: productForm.cncode_total || null,
        goods_name: productForm.goods_name || null,
        goods_engname: productForm.goods_engname || null,
        aggrgoods_name: productForm.aggrgoods_name || null,
        aggrgoods_engname: productForm.aggrgoods_engname || null,
        product_sell: parseFloat(productForm.product_sell.toString()) || 0, // float로 변환
        product_eusell: parseFloat(productForm.product_eusell.toString()) || 0 // float로 변환
      };

      if (editingProduct) {
        // 수정
        const response = await axiosClient.put(apiEndpoints.cbam.product.update(editingProduct.id), productData);
        console.log('✅ 제품 수정 성공:', response.data);
        setToast({
          message: '제품이 성공적으로 수정되었습니다.',
          type: 'success'
        });
      } else {
        // 생성
        const response = await axiosClient.post(apiEndpoints.cbam.product.create, productData);
        console.log('✅ 제품 생성 성공:', response.data);
        setToast({
          message: '제품이 성공적으로 생성되었습니다.',
          type: 'success'
        });
      }

      // 폼 초기화 및 숨기기
      resetProductForm();

      // 목록 새로고침
      fetchProducts();
    } catch (error: any) {
      console.error('❌ 제품 저장 실패:', error);
      setToast({
        message: `제품 저장에 실패했습니다: ${error.response?.data?.detail || error.message}`,
        type: 'error'
      });
    }
  };

  const handleProcessSubmit = async (e: React.FormEvent, productId: number) => {
    e.preventDefault();
    
    if (!processForm.process_name) {
      setToast({
        message: '공정명을 입력해주세요.',
        type: 'error'
      });
      return;
    }

    try {
      // 백엔드 스키마에 맞게 데이터 변환
      const processData = {
        process_name: processForm.process_name,
        start_period: null, // 선택적 필드
        end_period: null,   // 선택적 필드
        product_ids: [productId]  // 다대다 관계를 위해 배열로 전송
      };

      console.log('🔍 전송할 공정 데이터:', processData);
      console.log('🔍 API 엔드포인트:', apiEndpoints.cbam.process.create);

      const response = await axiosClient.post(apiEndpoints.cbam.process.create, processData);
      console.log('✅ 프로세스 생성 성공:', response.data);
      
      setToast({
        message: '프로세스가 성공적으로 생성되었습니다.',
        type: 'success'
      });

      // 폼 초기화 및 숨기기
      setProcessForm({
        process_name: ''
      });
      setShowProcessFormForProduct(null);

      // 목록 새로고침
      fetchProcesses();
      console.log('🔄 공정 목록 새로고침 완료');
    } catch (error: any) {
      console.error('❌ 프로세스 생성 실패:', error);
      console.error('❌ 에러 응답 데이터:', error.response?.data);
      console.error('❌ 에러 상태 코드:', error.response?.status);
      setToast({
        message: `프로세스 생성에 실패했습니다: ${error.response?.data?.detail || error.message}`,
        type: 'error'
      });
    }
  };

  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (!confirm(`"${productName}" 제품을 삭제하시겠습니까?\n\n⚠️ 주의: 이 제품과 연결된 모든 프로세스가 함께 삭제됩니다.`)) {
      return;
    }

    try {
      await axiosClient.delete(apiEndpoints.cbam.product.delete(productId));
      console.log('✅ 제품 삭제 성공');
      
      setToast({
        message: `"${productName}" 제품이 성공적으로 삭제되었습니다.`,
        type: 'success'
      });

      fetchProducts();
      fetchProcesses();
    } catch (error: any) {
      console.error('❌ 제품 삭제 실패:', error);
      setToast({
        message: `제품 삭제에 실패했습니다: ${error.response?.data?.detail || error.message}`,
        type: 'error'
      });
    }
  };

  const handleDeleteProcess = async (processId: number, processName: string) => {
    if (!confirm(`"${processName}" 프로세스를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await axiosClient.delete(apiEndpoints.cbam.process.delete(processId));
      console.log('✅ 프로세스 삭제 성공');
      
      setToast({
        message: `"${processName}" 프로세스가 성공적으로 삭제되었습니다.`,
        type: 'success'
      });

      fetchProcesses();
    } catch (error: any) {
      console.error('❌ 프로세스 삭제 실패:', error);
      setToast({
        message: `프로세스 삭제에 실패했습니다: ${error.response?.data?.detail || error.message}`,
        type: 'error'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-300 mt-4">데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* 토스트 메시지 */}
        {toast && (
          <div className={`mb-4 p-4 rounded-lg ${
            toast.type === 'success' ? 'bg-green-600' : 
            toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          }`}>
            {toast.message}
          </div>
        )}

        {/* HS 코드 검색 모달 */}
        {showHSCodeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-2xl mx-4 shadow-2xl">
              {/* 모달 헤더 */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">HS코드로 CN코드 검색</h3>
                <button
                  onClick={() => setShowHSCodeModal(false)}
                  className="text-gray-400 hover:text-white text-xl transition-colors"
                >
                  ×
                </button>
              </div>

              {/* 검색 입력 필드 */}
              <div className="mb-4">
                <input
                  type="text"
                  value={hsCodeSearchInput}
                  onChange={(e) => handleHSCodeSearchInputChange(e.target.value)}
                  placeholder="HS 코드를 입력하세요"
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>

              {/* 검색 결과 */}
              <div className="max-h-96 overflow-y-auto">
                {isSearching && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-300 mt-2">검색 중...</p>
                  </div>
                )}

                {!isSearching && searchResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">검색 결과 ({searchResults.length}개)</h4>
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectCNCodeFromModal(result)}
                        className="p-3 border border-gray-600 rounded-md cursor-pointer hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-blue-400">{result.cncode_total}</div>
                            <div className="text-xs text-gray-300 mt-1">{result.goods_name}</div>
                            <div className="text-xs text-gray-400">{result.aggregoods_name}</div>
                          </div>
                          <div className="text-xs text-gray-500 ml-2">선택</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isSearching && hsCodeSearchInput.length >= 2 && searchResults.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-400">검색 결과가 없습니다.</p>
                  </div>
                )}

                {hsCodeSearchInput.length < 2 && (
                  <div className="text-center py-4">
                    <p className="text-gray-400">HS 코드를 2자리 이상 입력해주세요.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 제품 관리 섹션 */}
        <div className="space-y-6">
          {/* 제품 생성/수정 폼 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">📦 제품 관리</h2>
              <button
                onClick={() => {
                  if (showProductForm) {
                    resetProductForm();
                  } else {
                    setShowProductForm(true);
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200"
              >
                {showProductForm ? '취소' : '제품 추가'}
              </button>
            </div>

            {showProductForm && (
              <form onSubmit={handleProductSubmit} className="space-y-4">
                {/* 기간 설정을 먼저 배치 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">기간 시작일 *</label>
                    <input
                      type="date"
                      value={productForm.prostart_period}
                      onChange={(e) => handlePeriodChange('prostart_period', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">기간 종료일 *</label>
                    <input
                      type="date"
                      value={productForm.proend_period}
                      onChange={(e) => handlePeriodChange('proend_period', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* 기간별 제품명 안내 메시지 */}
                {(productForm.prostart_period || productForm.proend_period) && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                    <p className="text-sm text-blue-300">
                      📅 <strong>기간 설정 완료:</strong> {productForm.prostart_period || '시작일 미설정'} ~ {productForm.proend_period || '종료일 미설정'}
                    </p>
                    <p className="text-xs text-blue-400 mt-1">
                      이제 아래에서 해당 기간에 생산되는 제품명을 선택할 수 있습니다.
                    </p>
                  </div>
                )}

                {/* 제품명 선택 (기간 설정 후 활성화) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    제품명 * 
                    {(!productForm.prostart_period || !productForm.proend_period) && (
                      <span className="text-yellow-400 text-xs ml-2">(기간을 먼저 설정해주세요)</span>
                    )}
                  </label>
                  <select
                    value={productForm.product_name}
                    onChange={(e) => handleProductInputChange('product_name', e.target.value)}
                    onFocus={() => {
                      // 드롭다운 클릭 시에만 데이터 로드
                      if (productForm.prostart_period && productForm.proend_period && productNames.length === 0) {
                        console.log('🔄 드롭다운 클릭, 제품명 목록 로드 시작');
                        fetchProductNamesByPeriod(productForm.prostart_period, productForm.proend_period);
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      (!productForm.prostart_period || !productForm.proend_period) 
                        ? 'bg-gray-700/50 border-gray-500 cursor-not-allowed' 
                        : 'bg-gray-800/50 border-gray-600'
                    }`}
                    required
                    disabled={productNamesLoading || !productForm.prostart_period || !productForm.proend_period}
                  >
                    <option value="">
                      {(!productForm.prostart_period || !productForm.proend_period) 
                        ? '기간을 먼저 설정해주세요' 
                        : productNamesLoading 
                          ? '제품명 목록을 불러오는 중...'
                          : '제품명을 선택하세요'
                      }
                    </option>
                    {productNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  
                  {/* 기간별 필터링 정보 표시 */}
                  {(productForm.prostart_period && productForm.proend_period) && (
                    <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-md">
                      <p className="text-xs text-green-300">
                        ✅ 해당 기간에 생산된 제품명 {productNames.length}개가 표시됩니다
                      </p>
                    </div>
                  )}
                  
                  {productNamesLoading && (
                    <p className="text-xs text-gray-400 mt-1">제품명 목록을 불러오는 중...</p>
                  )}
                  {productNamesError && (
                    <p className="text-xs text-red-400 mt-1">제품명 목록 로드 실패: {productNamesError}</p>
                  )}
                  {productNames.length === 0 && !productNamesLoading && !productNamesError && productForm.prostart_period && productForm.proend_period && (
                    <p className="text-xs text-yellow-400 mt-1">해당 기간에 생산된 제품명이 없습니다.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">제품 카테고리</label>
                  <select
                    value={productForm.product_category}
                    onChange={(e) => handleProductInputChange('product_category', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">카테고리를 선택하세요</option>
                    <option value="단순제품">단순제품</option>
                    <option value="복합제품">복합제품</option>
                  </select>
                </div>

                {/* CN 코드 입력 필드 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">CN 코드</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={productForm.cncode_total}
                        onChange={(e) => handleProductInputChange('cncode_total', e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="HS CODE 검색 후 자동 입력"
                        readOnly
                      />
                      <button
                        type="button"
                        onClick={openHSCodeModal}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200"
                      >
                        HS CODE 검색
                      </button>
                    </div>
                  </div>

                  {/* CN 코드 및 품목 정보 표시 */}
                  {productForm.cncode_total && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3">
                      <h4 className="text-sm font-medium text-green-300 mb-2">✅ 선택된 CN 코드:</h4>
                      <div className="space-y-1">
                        <div className="text-sm text-white">CN 코드: <span className="font-medium">{productForm.cncode_total}</span></div>
                        {productForm.goods_name && (
                          <div className="text-xs text-gray-300">품목명: {productForm.goods_name}</div>
                        )}
                        {productForm.goods_engname && (
                          <div className="text-xs text-gray-400">품목영문명: {productForm.goods_engname}</div>
                        )}
                        {productForm.aggrgoods_name && (
                          <div className="text-xs text-gray-300">품목군명: {productForm.aggrgoods_name}</div>
                        )}
                        {productForm.aggrgoods_engname && (
                          <div className="text-xs text-gray-400">품목군영문명: {productForm.aggrgoods_engname}</div>
                        )}
                      </div>
                    </div>
                  )}

                <div className="flex gap-4">
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={handleCancelEditProduct}
                      className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors duration-200"
                    >
                      취소
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200"
                  >
                    📦 {editingProduct ? '제품 수정' : '제품 생성'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 제품 목록 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">📋 등록된 제품 목록 ({products.length}개)</h3>
            
            {products.length === 0 ? (
              <p className="text-gray-300 text-center py-4">등록된 제품이 없습니다.</p>
            ) : (
              <div className="space-y-6">
                {products.map((product) => {
                  // 제품과 연결된 공정들 필터링 (product_id로 관계 확인)
                  const productProcesses = processes.filter(
                    process => process.product_id === product.id
                  );
                  
                  // 공정 데이터 유효성 검사
                  const validProcesses = productProcesses.filter(process => 
                    process && process.id && process.process_name && 
                    Object.keys(process).length > 0
                  );
                  
                  if (productProcesses.length !== validProcesses.length) {
                    console.warn(`⚠️ 제품 ${product.product_name} (ID: ${product.id})에서 ${productProcesses.length - validProcesses.length}개의 빈 공정 데이터 발견`);
                  }
                  
                  console.log(`🔍 제품 ${product.product_name} (ID: ${product.id})의 공정들:`, validProcesses);
                  const isShowingProcessForm = showProcessFormForProduct === product.id;
                  
                  return (
                    <div key={product.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                                             <div className="flex justify-between items-start mb-2">
                         <h4 className="text-white font-semibold text-lg">{product.product_name}</h4>
                       </div>
                      
                      <div className="space-y-1 mb-3">
                        <p className="text-gray-300 text-sm">기간: {product.prostart_period} ~ {product.proend_period}</p>
                        <p className="text-gray-300 text-sm">수량: {product.product_amount.toLocaleString()}</p>
                        <p className="text-gray-300 text-sm">공정 수: {validProcesses.length}개</p>
                        {product.product_category && (
                          <p className="text-gray-300 text-sm">카테고리: <span className="text-blue-300">{product.product_category}</span></p>
                        )}
                                                 {product.cncode_total && (
                           <div className="mt-2 p-2 bg-blue-500/10 rounded border border-blue-500/20">
                             <p className="text-blue-300 text-sm">CN 코드: <span className="font-medium">{product.cncode_total}</span></p>
                             {product.goods_name && (
                               <p className="text-gray-300 text-xs">품목명: {product.goods_name}</p>
                             )}
                             {product.goods_engname && (
                               <p className="text-gray-400 text-xs">품목영문명: {product.goods_engname}</p>
                             )}
                             {product.aggrgoods_name && (
                               <p className="text-gray-300 text-xs">품목군명: {product.aggrgoods_name}</p>
                             )}
                             {product.aggrgoods_engname && (
                               <p className="text-gray-400 text-xs">품목군영문명: {product.aggrgoods_engname}</p>
                             )}
                           </div>
                         )}
                      </div>

                      {/* 공정 목록 */}
                      {validProcesses.length > 0 && (
                        <div className="mb-4 p-3 bg-white/5 rounded-lg">
                          <h5 className="text-sm font-medium text-white mb-2">📋 등록된 공정:</h5>
                          <div className="space-y-2">
                            {validProcesses.map((process) => (
                              <div key={process.id} className="flex justify-between items-center p-2 bg-white/5 rounded">
                                <span className="text-gray-300 text-sm">{process.process_name}</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => router.push(`/cbam/process/process-input?process_id=${process.id}`)}
                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                                  >
                                    입력 데이터
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProcess(process.id, process.process_name)}
                                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                                  >
                                    삭제
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 공정 추가 폼 */}
                      {isShowingProcessForm && (
                        <div className="mb-4 p-4 bg-white/5 rounded-lg border border-purple-500/30">
                          <h5 className="text-sm font-medium text-white mb-3">🔄 공정 추가</h5>
                          <form onSubmit={(e) => handleProcessSubmit(e, product.id)} className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">공정명 *</label>
                              <input
                                type="text"
                                value={processForm.process_name}
                                onChange={(e) => handleProcessInputChange('process_name', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="예: 압연, 용해, 주조"
                                required
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
                              >
                                🔄 공정 생성
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowProcessFormForProduct(null)}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
                              >
                                취소
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowProcessFormForProduct(isShowingProcessForm ? null : product.id)}
                          className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
                        >
                          {isShowingProcessForm ? '공정 추가 취소' : '공정 추가'}
                        </button>
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.product_name)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
