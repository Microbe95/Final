import { useState, useCallback, useEffect, useRef } from 'react';
import { useNodesState, useEdgesState, Node, Edge, Connection } from '@xyflow/react';
import axiosClient, { apiEndpoints } from '@/lib/axiosClient';
import { Install, Product, Process } from './useProcessManager';

export const useProcessCanvas = (selectedInstall: Install | null) => {
  // ReactFlow 상태
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // 다중 사업장 캔버스 관리
  const [installCanvases, setInstallCanvases] = useState<{[key: number]: {nodes: Node[], edges: Edge[]}}>({});
  
  // activeInstallId를 selectedInstall에서 계산
  const activeInstallId = selectedInstall?.id || null;

  // 이전 상태를 추적하여 무한 루프 방지
  const prevInstallIdRef = useRef<number | null>(null);
  const prevNodesRef = useRef<Node[]>([]);
  const prevEdgesRef = useRef<Edge[]>([]);

  // 캔버스 상태 변경 시 해당 사업장의 캔버스 데이터 업데이트
  useEffect(() => {
    if (activeInstallId) {
      setInstallCanvases(prev => ({
        ...prev,
        [activeInstallId]: { nodes, edges }
      }));
    }
  }, [nodes, edges, activeInstallId]);

  // selectedInstall 변경 시 캔버스 상태 복원 (안전한 상태 업데이트)
  useEffect(() => {
    if (selectedInstall && selectedInstall.id !== prevInstallIdRef.current) {
      const canvasData = installCanvases[selectedInstall.id] || { nodes: [], edges: [] };
      
      // 이전 상태와 동일한지 확인하여 불필요한 업데이트 방지
      const nodesChanged = JSON.stringify(prevNodesRef.current) !== JSON.stringify(canvasData.nodes);
      const edgesChanged = JSON.stringify(prevEdgesRef.current) !== JSON.stringify(canvasData.edges);
      
      if (nodesChanged) {
        setNodes(canvasData.nodes);
        prevNodesRef.current = canvasData.nodes;
      }
      
      if (edgesChanged) {
        setEdges(canvasData.edges);
        prevEdgesRef.current = canvasData.edges;
      }
      
      prevInstallIdRef.current = selectedInstall.id;
    }
  }, [selectedInstall?.id, installCanvases, setNodes, setEdges]);

  // 사업장 선택 시 캔버스 상태 복원 (이제 useEffect에서 자동 처리)
  const handleInstallSelect = useCallback((install: Install) => {
    // 이 함수는 이제 사용되지 않지만, 호환성을 위해 유지
    // 실제 캔버스 상태 복원은 useEffect에서 자동으로 처리됨
  }, []);

  // 제품 노드 추가 (안전한 상태 업데이트)
  const addProductNode = useCallback((product: Product, handleProductNodeClick: (product: Product) => void) => {
    const newNode: Node = {
      id: `product-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: 'product',  // 'product' 타입으로 설정
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        id: product.id,  // 실제 제품 ID 추가
        label: product.product_name,  // 🔴 수정: label을 올바르게 설정
        description: `제품: ${product.product_name}`,
        variant: 'product',  // 🔴 수정: variant를 'product'로 명시적 설정
        productData: product,  // 🔴 수정: productData를 올바르게 설정
        install_id: selectedInstall?.id,
        onClick: () => handleProductNodeClick(product),
        // 🔴 추가: ProductNode가 기대하는 추가 데이터
        size: 'md',
        showHandles: true,
      },
    };

    console.log('🔍 제품 노드 생성:', newNode); // 🔴 추가: 디버깅 로그

    // setNodes를 사용하여 안전하게 노드 추가
    setNodes(prev => {
      const newNodes = [...prev, newNode];
      prevNodesRef.current = newNodes;
      console.log('🔍 노드 상태 업데이트:', newNodes); // 🔴 추가: 디버깅 로그
      return newNodes;
    });
  }, [setNodes, selectedInstall?.id]);

  // 공정 노드 추가 (안전한 상태 업데이트)
  const addProcessNode = useCallback((process: Process, products: Product[], openMatDirModal: (process: Process) => void, openFuelDirModal: (process: Process) => void) => {
    // 해당 공정이 사용되는 모든 제품 정보 찾기
    const relatedProducts = products.filter((product: Product) => 
      process.products && process.products.some((p: Product) => p.id === product.id)
    );
    const productNames = relatedProducts.map((product: Product) => product.product_name).join(', ');
    
    // 외부 사업장의 공정인지 확인
    const isExternalProcess = process.products && 
      process.products.some((p: Product) => p.install_id !== selectedInstall?.id);
    
    const newNode: Node = {
      id: `process-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: 'process',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        id: process.id,  // 실제 공정 ID 추가
        label: process.process_name,
        description: `공정: ${process.process_name}`,
        variant: 'process',
        processData: process,
        product_names: productNames || '알 수 없음',
        install_id: selectedInstall?.id,
        current_install_id: selectedInstall?.id,
        is_readonly: isExternalProcess,
        related_products: relatedProducts,
        is_many_to_many: true,
        onMatDirClick: openMatDirModal,
        onFuelDirClick: openFuelDirModal,
      },
    };

    // setNodes를 사용하여 안전하게 노드 추가
    setNodes(prev => {
      const newNodes = [...prev, newNode];
      prevNodesRef.current = newNodes;
      return newNodes;
    });
  }, [setNodes, selectedInstall?.id]);

  // 그룹 노드 추가 (안전한 상태 업데이트)
  const addGroupNode = useCallback(() => {
    const newNode: Node<any> = {
      id: `group-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: 'group',  // 🔴 수정: 'group' 타입으로 설정
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      style: { width: 200, height: 100 },
      data: { 
        label: '그룹',  // 🔴 수정: label을 올바르게 설정
        description: '그룹 노드',
        variant: 'default',  // 🔴 추가: variant 설정
        size: 'md',  // 🔴 추가: size 설정
        showHandles: true,  // 🔴 추가: showHandles 설정
      },
    };

    console.log('🔍 그룹 노드 생성:', newNode); // 🔴 추가: 디버깅 로그

    // setNodes를 사용하여 안전하게 노드 추가
    setNodes(prev => {
      const newNodes = [...prev, newNode];
      prevNodesRef.current = newNodes;
      console.log('🔍 노드 상태 업데이트:', newNodes); // 🔴 추가: 디버깅 로그
      return newNodes;
    });
  }, [setNodes]);

  // Edge 생성 처리 (안전한 상태 업데이트)
  const handleEdgeCreate = useCallback(async (params: Connection, updateProcessChainsAfterEdge: () => void) => {
    try {
      // 노드 ID에서 숫자 부분만 추출 (예: "product-123-abc" → 123)
      const extractNodeId = (nodeId: string): number => {
        const match = nodeId.match(/(?:product|process|group)-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      
      const sourceId = extractNodeId(params.source!);
      const targetId = extractNodeId(params.target!);
      
      if (sourceId === 0 || targetId === 0) {
        console.error('유효하지 않은 노드 ID:', { source: params.source, target: params.target });
        return;
      }
      
      // 백엔드에 Edge 생성 요청
      const edgeData = {
        source_id: sourceId,
        target_id: targetId,
        edge_kind: 'continue'
      };
      
      console.log('🔗 Edge 생성 요청:', edgeData);
      
      const response = await axiosClient.post(apiEndpoints.cbam.edge.create, edgeData);
      
      if (response.status === 201) {
        const newEdge = response.data;
        console.log('✅ Edge 생성 성공:', newEdge);
        
        // ReactFlow 상태에 Edge 추가 (setEdges 사용)
        const edgeToAdd = {
          id: `e-${newEdge.id}`,
          source: params.source!,
          target: params.target!,
          type: 'custom',
          data: { edgeData: newEdge }
        };
        
        setEdges(prev => {
          const newEdges = [...prev, edgeToAdd];
          prevEdgesRef.current = newEdges;
          return newEdges;
        });
        
        // 콜백 실행
        if (updateProcessChainsAfterEdge) {
          updateProcessChainsAfterEdge();
        }
      }
    } catch (error: any) {
      // 🔴 개선: 더 자세한 에러 로깅
      console.error('❌ Edge 생성 실패:', {
        error: error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        params: params
      });
      
      // 🔴 추가: 사용자에게 에러 알림 (Toast 등으로 표시 가능)
      if (error.response?.status === 500) {
        console.error('🔴 서버 내부 오류 - Edge 생성 실패');
      } else if (error.response?.status === 400) {
        console.error('🔴 잘못된 요청 - Edge 데이터 검증 실패');
      } else if (error.code === 'NETWORK_ERROR') {
        console.error('🔴 네트워크 오류 - 서버 연결 실패');
      } else {
        console.error('🔴 알 수 없는 오류:', error);
      }
    }
  }, [setEdges]);

  return {
    // 상태
    nodes,
    edges,
    installCanvases,
    activeInstallId,

    // 이벤트 핸들러
    onNodesChange,
    onEdgesChange,
    handleEdgeCreate,

    // 액션
    handleInstallSelect,
    addProductNode,
    addProcessNode,
    addGroupNode,
  };
};
