# ============================================================================
# 🎯 Calculation Service - Product 비즈니스 로직
# ============================================================================

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.domain.calculation.calculation_repository import CalculationRepository
from app.domain.calculation.calculation_schema import (
    ProductCreateRequest, ProductResponse, ProductUpdateRequest, 
    ProcessCreateRequest, ProcessResponse, ProcessUpdateRequest, 
    ProductNameResponse, InstallCreateRequest, InstallResponse, 
    InstallUpdateRequest, InstallNameResponse, ProcessInputCreateRequest, 
    ProcessInputResponse, ProcessInputUpdateRequest, 
    ProductProcessCreateRequest, ProductProcessResponse
)

logger = logging.getLogger(__name__)

class CalculationService:
    """Product 비즈니스 로직 클래스"""
    
    def __init__(self):
        self.calc_repository = CalculationRepository()
        logger.info("✅ Product 서비스 초기화 완료")
    
    # ============================================================================
    # 🏭 Install 관련 메서드
    # ============================================================================
    
    async def create_install(self, request: InstallCreateRequest) -> InstallResponse:
        """사업장 생성"""
        try:
            install_data = {
                "install_name": request.install_name,
                "reporting_year": request.reporting_year
            }
            
            saved_install = await self.calc_repository.create_install(install_data)
            if saved_install:
                return InstallResponse(**saved_install)
            else:
                raise Exception("사업장 저장에 실패했습니다.")
        except Exception as e:
            logger.error(f"Error creating install: {e}")
            raise e
    
    async def get_installs(self) -> List[InstallResponse]:
        """사업장 목록 조회"""
        try:
            installs = await self.calc_repository.get_installs()
            return [InstallResponse(**install) for install in installs]
        except Exception as e:
            logger.error(f"Error getting installs: {e}")
            raise e
    
    async def get_install_names(self) -> List[InstallNameResponse]:
        """사업장명 목록 조회 (드롭다운용)"""
        try:
            install_names = await self.calc_repository.get_install_names()
            return [InstallNameResponse(**install) for install in install_names]
        except Exception as e:
            logger.error(f"Error getting install names: {e}")
            raise e
    
    async def get_install(self, install_id: int) -> Optional[InstallResponse]:
        """특정 사업장 조회"""
        try:
            install = await self.calc_repository.get_install(install_id)
            if install:
                return InstallResponse(**install)
            return None
        except Exception as e:
            logger.error(f"Error getting install {install_id}: {e}")
            raise e
    
    async def update_install(self, install_id: int, request: InstallUpdateRequest) -> Optional[InstallResponse]:
        """사업장 수정"""
        try:
            # None이 아닌 필드만 업데이트 데이터에 포함
            update_data = {}
            if request.install_name is not None:
                update_data["install_name"] = request.install_name
            if request.reporting_year is not None:
                update_data["reporting_year"] = request.reporting_year
            
            if not update_data:
                raise Exception("업데이트할 데이터가 없습니다.")
            
            updated_install = await self.calc_repository.update_install(install_id, update_data)
            if updated_install:
                return InstallResponse(**updated_install)
            return None
        except Exception as e:
            logger.error(f"Error updating install {install_id}: {e}")
            raise e
    
    async def delete_install(self, install_id: int) -> bool:
        """사업장 삭제"""
        try:
            success = await self.calc_repository.delete_install(install_id)
            return success
        except Exception as e:
            logger.error(f"Error deleting install {install_id}: {e}")
            raise e

    # ============================================================================
    # 📦 Product 관련 메서드
    # ============================================================================
    
    async def create_product(self, request: ProductCreateRequest) -> ProductResponse:
        """제품 생성"""
        try:
            product_data = {
                "install_id": request.install_id,
                "product_name": request.product_name,
                "product_category": request.product_category,
                "prostart_period": request.prostart_period,
                "proend_period": request.proend_period,
                "product_amount": request.product_amount,
                "cncode_total": request.cncode_total,
                "goods_name": request.goods_name,
                "aggrgoods_name": request.aggrgoods_name,
                "product_sell": request.product_sell,
                "product_eusell": request.product_eusell
            }
            
            saved_product = await self.calc_repository.create_product(product_data)
            if saved_product:
                return ProductResponse(**saved_product)
            else:
                raise Exception("제품 저장에 실패했습니다.")
        except Exception as e:
            logger.error(f"Error creating product: {e}")
            raise e
    
    async def get_products(self) -> List[ProductResponse]:
        """제품 목록 조회"""
        try:
            products = await self.calc_repository.get_products()
            return [ProductResponse(**product) for product in products]
        except Exception as e:
            logger.error(f"Error getting products: {e}")
            raise e
    
    async def get_product_names(self) -> List[ProductNameResponse]:
        """제품명 목록 조회 (드롭다운용)"""
        try:
            product_names = await self.calc_repository.get_product_names()
            return [ProductNameResponse(**product) for product in product_names]
        except Exception as e:
            logger.error(f"Error getting product names: {e}")
            raise e
    
    async def get_product(self, product_id: int) -> Optional[ProductResponse]:
        """특정 제품 조회"""
        try:
            product = await self.calc_repository.get_product(product_id)
            if product:
                return ProductResponse(**product)
            return None
        except Exception as e:
            logger.error(f"Error getting product {product_id}: {e}")
            raise e
    
    async def update_product(self, product_id: int, request: ProductUpdateRequest) -> Optional[ProductResponse]:
        """제품 수정"""
        try:
            # None이 아닌 필드만 업데이트 데이터에 포함
            update_data = {}
            if request.install_id is not None:
                update_data["install_id"] = request.install_id
            if request.product_name is not None:
                update_data["product_name"] = request.product_name
            if request.product_category is not None:
                update_data["product_category"] = request.product_category
            if request.prostart_period is not None:
                update_data["prostart_period"] = request.prostart_period
            if request.proend_period is not None:
                update_data["proend_period"] = request.proend_period
            if request.product_amount is not None:
                update_data["product_amount"] = request.product_amount
            if request.cncode_total is not None:
                update_data["cncode_total"] = request.cncode_total
            if request.goods_name is not None:
                update_data["goods_name"] = request.goods_name
            if request.aggrgoods_name is not None:
                update_data["aggrgoods_name"] = request.aggrgoods_name
            if request.product_sell is not None:
                update_data["product_sell"] = request.product_sell
            if request.product_eusell is not None:
                update_data["product_eusell"] = request.product_eusell
            
            if not update_data:
                raise Exception("업데이트할 데이터가 없습니다.")
            
            updated_product = await self.calc_repository.update_product(product_id, update_data)
            if updated_product:
                return ProductResponse(**updated_product)
            return None
        except Exception as e:
            logger.error(f"Error updating product {product_id}: {e}")
            raise e
    
    async def delete_product(self, product_id: int) -> bool:
        """제품 삭제"""
        try:
            success = await self.calc_repository.delete_product(product_id)
            return success
        except Exception as e:
            logger.error(f"Error deleting product {product_id}: {e}")
            raise e

    # ============================================================================
    # 🔄 Process 관련 메서드
    # ============================================================================
    
    async def create_process(self, request: ProcessCreateRequest) -> ProcessResponse:
        """공정 생성 (다대다 관계)"""
        try:
            process_data = {
                "process_name": request.process_name,
                "start_period": request.start_period,
                "end_period": request.end_period,
                "product_ids": getattr(request, 'product_ids', [])  # 다대다 관계를 위한 제품 ID 목록
            }
            
            saved_process = await self.calc_repository.create_process(process_data)
            if saved_process:
                return ProcessResponse(**saved_process)
            else:
                raise Exception("공정 저장에 실패했습니다.")
        except Exception as e:
            logger.error(f"Error creating process: {e}")
            raise e
    
    async def get_processes(self) -> List[ProcessResponse]:
        """프로세스 목록 조회"""
        try:
            processes = await self.calc_repository.get_processes()
            return [ProcessResponse(**process) for process in processes]
        except Exception as e:
            logger.error(f"Error getting processes: {e}")
            raise e
    
    async def get_process(self, process_id: int) -> Optional[ProcessResponse]:
        """특정 프로세스 조회"""
        try:
            process = await self.calc_repository.get_process(process_id)
            if process:
                return ProcessResponse(**process)
            return None
        except Exception as e:
            logger.error(f"Error getting process {process_id}: {e}")
            raise e
    
    async def update_process(self, process_id: int, request: ProcessUpdateRequest) -> Optional[ProcessResponse]:
        """프로세스 수정"""
        try:
            # None이 아닌 필드만 업데이트 데이터에 포함
            update_data = {}
            if request.product_id is not None:
                update_data["product_id"] = request.product_id
            if request.process_name is not None:
                update_data["process_name"] = request.process_name
            if request.start_period is not None:
                update_data["start_period"] = request.start_period
            if request.end_period is not None:
                update_data["end_period"] = request.end_period
            
            if not update_data:
                raise Exception("업데이트할 데이터가 없습니다.")
            
            updated_process = await self.calc_repository.update_process(process_id, update_data)
            if updated_process:
                return ProcessResponse(**updated_process)
            return None
        except Exception as e:
            logger.error(f"Error updating process {process_id}: {e}")
            raise e
    
    async def delete_process(self, process_id: int) -> bool:
        """프로세스 삭제"""
        try:
            success = await self.calc_repository.delete_process(process_id)
            return success
        except Exception as e:
            logger.error(f"Error deleting process {process_id}: {e}")
            raise e

    # ============================================================================
    # 🔗 ProductProcess 관련 메서드 (다대다 관계)
    # ============================================================================
    
    async def create_product_process(self, request: ProductProcessCreateRequest) -> ProductProcessResponse:
        """제품-공정 관계 생성"""
        try:
            product_process_data = {
                "product_id": request.product_id,
                "process_id": request.process_id
            }
            
            saved_product_process = await self.calc_repository.create_product_process(product_process_data)
            if saved_product_process:
                return ProductProcessResponse(**saved_product_process)
            else:
                raise Exception("제품-공정 관계 저장에 실패했습니다.")
        except Exception as e:
            logger.error(f"Error creating product-process relationship: {e}")
            raise e
    
    async def delete_product_process(self, product_id: int, process_id: int) -> bool:
        """제품-공정 관계 삭제"""
        try:
            success = await self.calc_repository.delete_product_process(product_id, process_id)
            return success
        except Exception as e:
            logger.error(f"Error deleting product-process relationship: {e}")
            raise e



# ============================================================================
# 🧮 배출량 계산 메서드
# ============================================================================

    async def calculate_process_emission(self, process_id: int) -> Dict[str, Any]:
        """프로세스별 배출량 계산 (process_input 테이블 삭제로 인해 임시 비활성화)"""
        try:
            # TODO: 새로운 배출량 계산 로직 구현 필요
            logger.warning("process_input 테이블이 삭제되어 배출량 계산이 비활성화되었습니다.")
            
            return {
                'process_id': process_id,
                'total_direct_emission': 0.0,
                'total_indirect_emission': 0.0,
                'total_emission': 0.0,
                'calculation_details': []
            }
            
        except Exception as e:
            logger.error(f"Error calculating process emission: {e}")
            raise e

    async def calculate_product_emission(self, product_id: int) -> Dict[str, Any]:
        """제품별 총 배출량 계산"""
        try:
            # 제품 정보 조회
            product = await self.calc_repository.get_product(product_id)
            if not product:
                raise Exception("제품을 찾을 수 없습니다.")
            
            # 제품 관련 프로세스 조회
            processes = await self.calc_repository.get_processes_by_product(product_id)
            
            total_direct_emission = 0.0
            total_indirect_emission = 0.0
            process_details = []
            
            for process in processes:
                # 각 프로세스의 배출량 계산
                process_emission = await self.calculate_process_emission(process.get('id'))
                
                total_direct_emission += process_emission['total_direct_emission']
                total_indirect_emission += process_emission['total_indirect_emission']
                
                process_details.append({
                    'process_id': process.get('id'),
                    'process_name': process.get('process_name'),
                    'direct_emission': process_emission['total_direct_emission'],
                    'indirect_emission': process_emission['total_indirect_emission'],
                    'total_emission': process_emission['total_emission']
                })
            
            total_emission = total_direct_emission + total_indirect_emission
            
            return {
                'product_id': product_id,
                'product_name': product.get('product_name'),
                'total_emission': total_emission,
                'direct_emission': total_direct_emission,
                'indirect_emission': total_indirect_emission,
                'processes': process_details
            }
            
        except Exception as e:
            logger.error(f"Error calculating product emission: {e}")
            raise e