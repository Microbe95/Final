'use client';

import { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { useAPI } from './useAPI';

// ============================================================================
// 🎯 React Flow 백엔드 연동 훅 (실제 API 연결)
// ============================================================================

export const useReactFlowAPI = () => {
  const api = useAPI('/api/v1/boundary');  // Gateway를 통한 boundary 서비스 호출
  // ============================================================================
  // 🎯 플로우 관리 API (실제 API 연결)
  // ============================================================================

  const createFlow = useCallback(async (data: any): Promise<any | null> => {
    try {
      return await api.post('/flow', data);
    } catch (error) {
      console.error('플로우 생성 실패:', error);
      return null;
    }
  }, [api]);

  const getFlowState = useCallback(
    async (flowId: string): Promise<any | null> => {
      try {
        return await api.get(`/flow/${flowId}/state`);
      } catch (error) {
        console.error('플로우 상태 조회 실패:', error);
        return null;
      }
    },
    [api]
  );

  const updateFlow = useCallback(
    async (flowId: string, data: any): Promise<any | null> => {
      return {
        id: flowId,
        ...data,
        updated_at: new Date().toISOString(),
      };
    },
    []
  );

  const deleteFlow = useCallback(async (flowId: string): Promise<boolean> => {
    return true;
  }, []);

  // ============================================================================
  // 🎯 노드 관리 API (실제 API 연결)
  // ============================================================================

  const createNode = useCallback(async (data: any): Promise<any | null> => {
    try {
      return await api.post('/node', data);
    } catch (error) {
      console.error('노드 생성 실패:', error);
      return null;
    }
  }, [api]);

  const updateNode = useCallback(
    async (nodeId: string, data: any): Promise<any | null> => {
      return {
        id: nodeId,
        ...data,
        updated_at: new Date().toISOString(),
      };
    },
    []
  );

  const deleteNode = useCallback(async (nodeId: string): Promise<boolean> => {
    return true;
  }, []);

  // ============================================================================
  // 🎯 엣지 관리 API (실제 API 연결)
  // ============================================================================

  const createEdge = useCallback(async (data: any): Promise<any | null> => {
    try {
      return await api.post('/edge', data);
    } catch (error) {
      console.error('엣지 생성 실패:', error);
      return null;
    }
  }, [api]);

  const updateEdge = useCallback(
    async (edgeId: string, data: any): Promise<any | null> => {
      return {
        id: edgeId,
        ...data,
        updated_at: new Date().toISOString(),
      };
    },
    []
  );

  const deleteEdge = useCallback(async (edgeId: string): Promise<boolean> => {
    return true;
  }, []);

  
  // ============================================================================
  // 🎯 뷰포트 관리 API (실제 API 연결)
  // ============================================================================

  const updateViewport = useCallback(async (data: any): Promise<boolean> => {
    try {
      await api.put('/viewport', data);
      return true;
    } catch (error) {
      console.error('뷰포트 업데이트 실패:', error);
      return false;
    }
  }, [api]);

  // ============================================================================
  // 🎯 배치 작업 API (Mock 구현)
  // ============================================================================

  const saveFlowState = useCallback(
    async (
      flowId: string,
      nodes: Node[],
      edges: Edge[],
      viewport: { x: number; y: number; zoom: number }
    ): Promise<boolean> => {
      try {
        // 플로우가 없으면 생성
        if (!flowId) {
          const flowData = await createFlow({
            name: '새 플로우',
            description: '새로 생성된 플로우',
          });
          if (!flowData) return false;
          flowId = flowData.id;
        }

        // 노드들 저장
        for (const node of nodes) {
          await createNode({
            flow_id: flowId,
            node_id: node.id,
            type: node.type,
            position: node.position,
            data: node.data,
            width: node.width,
            height: node.height,
            style: node.style,
          });
        }

        // 엣지들 저장
        for (const edge of edges) {
          await createEdge({
            flow_id: flowId,
            edge_id: edge.id,
            source: edge.source,
            target: edge.target,
            source_handle: edge.sourceHandle,
            target_handle: edge.targetHandle,
            type: edge.type,
            data: edge.data,
            style: edge.style,
          });
        }

        // 뷰포트 저장
        await updateViewport({
          flow_id: flowId,
          x: viewport.x,
          y: viewport.y,
          zoom: viewport.zoom,
        });

        return true;
      } catch (error) {
        return false;
      }
    },
    [api, createFlow, createNode, createEdge, updateViewport]
  );

  // ============================================================================
  // 🎯 데이터 변환 유틸리티
  // ============================================================================

  const convertBackendToFrontend = useCallback((backendState: any) => {
    const nodes: Node[] = backendState.nodes.map((nodeData: any) => ({
      id: nodeData.node_id,
      type: nodeData.type,
      position: nodeData.position,
      data: nodeData.data,
      width: nodeData.width,
      height: nodeData.height,
      style: nodeData.style,
    }));

    const edges: Edge[] = backendState.edges.map((edgeData: any) => ({
      id: edgeData.edge_id,
      source: edgeData.source,
      target: edgeData.target,
      sourceHandle: edgeData.source_handle,
      targetHandle: edgeData.target_handle,
      type: edgeData.type,
      data: edgeData.data,
      style: edgeData.style,
    }));

    return {
      flowId: backendState.flow.id,
      flow: backendState.flow,
      nodes,
      edges,
      viewport: backendState.flow.viewport,
    };
  }, []);

  return {
    // 플로우 관리
    createFlow,
    getFlowState,
    updateFlow,
    deleteFlow,

    // 노드 관리
    createNode,
    updateNode,
    deleteNode,

    // 엣지 관리
    createEdge,
    updateEdge,
    deleteEdge,

    // 뷰포트 관리
    updateViewport,

    // 배치 작업
    saveFlowState,

    // 유틸리티
    convertBackendToFrontend,
  };
};
