'use client';

import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
  EdgeTypes,
} from '@xyflow/react';
import ProcessNode from '../organisms/ProcessNode';
import ProcessEdge from '../organisms/ProcessEdge';
import ProcessFlowControls from '../organisms/ProcessFlowControls';
// API는 page.tsx에 통합되어 있음


const nodeTypes: NodeTypes = {
  processNode: ProcessNode as any,
};

const edgeTypes: EdgeTypes = {
  processEdge: ProcessEdge as any,
};

interface ProcessFlowEditorProps {
  initialNodes?: Node<any>[];
  initialEdges?: Edge<any>[];
  onFlowChange?: (nodes: Node[], edges: Edge[]) => void;
  readOnly?: boolean;
}

const ProcessFlowEditor: React.FC<ProcessFlowEditorProps> = ({
  initialNodes = [],
  initialEdges = [],
  onFlowChange,
  readOnly = false,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 외부에서 전달받은 nodes/edges가 변경되면 내부 상태도 업데이트
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge<any> = {
        id: `edge-${Date.now()}`,
        source: params.source!,
        target: params.target!,
        type: 'processEdge',
        data: {
          label: '공정 흐름',
          processType: 'standard',
        },
      };
      setEdges((eds: any) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onFlowChangeHandler = useCallback(() => {
    if (onFlowChange) {
      onFlowChange(nodes, edges);
    }
  }, [nodes, edges, onFlowChange]);

  // 노드나 엣지가 변경될 때마다 콜백 호출
  React.useEffect(() => {
    onFlowChangeHandler();
  }, [nodes, edges, onFlowChangeHandler]);

  const addProcessNode = useCallback(() => {
    const newNode: Node<any> = {
      id: `node-${Date.now()}`,
      type: 'processNode',
      position: { x: 250, y: 250 },
      data: {
        label: '새 공정 단계',
        processType: 'manufacturing',
        description: '공정 단계 설명을 입력하세요',
        parameters: {},
      },
    };
    setNodes((nds: any) => [...nds, newNode]);
  }, [setNodes]);

  const deleteSelectedElements = useCallback(() => {
    const selectedNodes = nodes.filter((node: any) => node.selected);
    const selectedEdges = edges.filter((edge: any) => edge.selected);
    
    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      setNodes((nds: any) => nds.filter((node: any) => !node.selected));
      setEdges((eds: any) => eds.filter((edge: any) => !edge.selected));
    }
  }, [nodes, edges, setNodes, setEdges]);

  // ============================================================================
  // 💾 로컬 저장소에 공정도 저장
  // ============================================================================
  
  const saveToLocalStorage = useCallback(() => {
    try {
      const flowData = {
        nodes,
        edges,
        timestamp: new Date().toISOString(),
      };
      
      localStorage.setItem('processFlowData', JSON.stringify(flowData));
      // console.log 제거
    } catch (error) {
      console.error('❌ 로컬 저장 실패:', error);
    }
  }, [nodes, edges]);

  // ============================================================================
  // 📥 로컬 저장소에서 공정도 로드
  // ============================================================================
  
  const loadFromLocalStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem('processFlowData');
      
      if (savedData) {
        const flowData = JSON.parse(savedData);
        setNodes(flowData.nodes || []);
        setEdges(flowData.edges || []);
        // console.log 제거
      } else {
        // console.log 제거
      }
    } catch (error) {
      console.error('❌ 로컬 로드 실패:', error);
    }
  }, [setNodes, setEdges]);

  return (
    <div className="w-full h-full min-h-[600px] bg-[#0b0c0f] rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-[#0b0c0f]"
        style={{ backgroundColor: '#0b0c0f' }}
      >
        <Controls />
        <Background variant={"dots" as any} color="#334155" />
        <MiniMap
          nodeStrokeColor={(n) => {
            if (n.type === 'processNode') return '#1a192b';
            return '#eee';
          }}
          nodeColor={(n) => {
            if (n.selected) return '#ff0072';
            return '#fff';
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default ProcessFlowEditor;
