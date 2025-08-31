# ============================================================================
# 🏭 Product Repository - 제품 데이터 접근
# ============================================================================

import logging
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncpg

from .product_schema import ProductCreateRequest, ProductUpdateRequest

logger = logging.getLogger(__name__)

class ProductRepository:
    """제품 데이터 접근 클래스"""
    
    def __init__(self):
        self.database_url = os.getenv('DATABASE_URL')
        if not self.database_url:
            logger.warning("DATABASE_URL 환경변수가 설정되지 않았습니다. 데이터베이스 기능이 제한됩니다.")
            return
        
        # asyncpg 연결 풀 초기화
        self.pool = None
    
    async def initialize(self):
        """데이터베이스 연결 풀 초기화"""
        if not self.database_url:
            logger.warning("DATABASE_URL이 없어 데이터베이스 초기화를 건너뜁니다.")
            return
        
        try:
            # asyncpg 연결 풀 생성
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=1,
                max_size=10,
                command_timeout=30,
                server_settings={
                    'application_name': 'cbam-service-product'
                }
            )
            
            logger.info("✅ Product 데이터베이스 연결 풀 생성 성공")
            
            # 테이블 생성은 선택적으로 실행
            try:
                await self._create_product_table_async()
            except Exception as e:
                logger.warning(f"⚠️ Product 테이블 생성 실패 (기본 기능은 정상): {e}")
            
        except Exception as e:
            logger.error(f"❌ Product 데이터베이스 연결 실패: {str(e)}")
            logger.warning("데이터베이스 연결 실패로 인해 일부 기능이 제한됩니다.")
            self.pool = None
    
    async def _create_product_table_async(self):
        """Product 테이블 생성 (비동기)"""
        if not self.pool:
            logger.warning("데이터베이스 연결 풀이 초기화되지 않았습니다.")
            return
            
        try:
            async with self.pool.acquire() as conn:
                # product 테이블 생성
                result = await conn.fetchval("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'product'
                    );
                """)
                
                if not result:
                    logger.info("⚠️ product 테이블이 존재하지 않습니다. 자동으로 생성합니다.")
                    
                    await conn.execute("""
                        CREATE TABLE IF NOT EXISTS product (
                            id SERIAL PRIMARY KEY,
                            install_id INTEGER NOT NULL,
                            product_name TEXT NOT NULL,
                            product_category TEXT NOT NULL,
                            prostart_period DATE NOT NULL,
                            proend_period DATE NOT NULL,
                            product_amount NUMERIC(15, 6) NOT NULL DEFAULT 0,
                            cncode_total TEXT,
                            goods_name TEXT,
                            goods_engname TEXT,
                            aggrgoods_name TEXT,
                            aggrgoods_engname TEXT,
                            product_sell NUMERIC(15, 6) DEFAULT 0,
                            product_eusell NUMERIC(15, 6) DEFAULT 0,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                        );
                    """)
                    
                    logger.info("✅ product 테이블 생성 완료")
                else:
                    logger.info("✅ product 테이블 확인 완료")
                
        except Exception as e:
            logger.error(f"❌ Product 테이블 생성 실패: {str(e)}")
            logger.warning("⚠️ 테이블 생성 실패로 인해 일부 기능이 제한될 수 있습니다.")

    # ============================================================================
    # 🏭 Product 관련 Repository 메서드
    # ============================================================================

    async def create_product(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """제품 생성"""
        if not self.pool:
            await self.initialize()
            if not self.pool:
                raise Exception("데이터베이스 연결 풀을 초기화할 수 없습니다.")
        
        try:
            async with self.pool.acquire() as conn:
                result = await conn.fetchrow("""
                    INSERT INTO product (
                        install_id, product_name, product_category, prostart_period, proend_period,
                        product_amount, cncode_total, goods_name, goods_engname, aggrgoods_name,
                        aggrgoods_engname, product_sell, product_eusell
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    RETURNING *
                """, (
                    product_data.get('install_id'),
                    product_data.get('product_name'),
                    product_data.get('product_category'),
                    product_data.get('prostart_period'),
                    product_data.get('proend_period'),
                    product_data.get('product_amount', 0),
                    product_data.get('cncode_total'),
                    product_data.get('goods_name'),
                    product_data.get('goods_engname'),
                    product_data.get('aggrgoods_name'),
                    product_data.get('aggrgoods_engname'),
                    product_data.get('product_sell', 0),
                    product_data.get('product_eusell', 0)
                ))
                
                return dict(result)
                
        except Exception as e:
            logger.error(f"❌ 제품 생성 실패: {str(e)}")
            raise e

    async def get_products(self) -> List[Dict[str, Any]]:
        """모든 제품 조회"""
        if not self.pool:
            await self.initialize()
            if not self.pool:
                raise Exception("데이터베이스 연결 풀을 초기화할 수 없습니다.")
        
        try:
            async with self.pool.acquire() as conn:
                results = await conn.fetch("""
                    SELECT * FROM product ORDER BY id
                """)
                
                products = []
                for row in results:
                    product_dict = dict(row)
                    # datetime.date 객체를 문자열로 변환
                    if 'prostart_period' in product_dict and product_dict['prostart_period']:
                        product_dict['prostart_period'] = product_dict['prostart_period'].isoformat()
                    if 'proend_period' in product_dict and product_dict['proend_period']:
                        product_dict['proend_period'] = product_dict['proend_period'].isoformat()
                    products.append(product_dict)
                
                return products
                
        except Exception as e:
            logger.error(f"❌ 제품 목록 조회 실패: {str(e)}")
            raise e

    async def get_product(self, product_id: int) -> Optional[Dict[str, Any]]:
        """특정 제품 조회"""
        if not self.pool:
            await self.initialize()
            if not self.pool:
                raise Exception("데이터베이스 연결 풀을 초기화할 수 없습니다.")
        
        try:
            async with self.pool.acquire() as conn:
                result = await conn.fetchrow("""
                    SELECT * FROM product WHERE id = $1
                """, (product_id,))
                
                if result:
                    product_dict = dict(result)
                    # datetime.date 객체를 문자열로 변환
                    if 'prostart_period' in product_dict and product_dict['prostart_period']:
                        product_dict['prostart_period'] = product_dict['prostart_period'].isoformat()
                    if 'proend_period' in product_dict and product_dict['proend_period']:
                        product_dict['proend_period'] = product_dict['proend_period'].isoformat()
                    return product_dict
                else:
                    return None
                
        except Exception as e:
            logger.error(f"❌ 제품 조회 실패: {str(e)}")
            raise e

    async def update_product(self, product_id: int, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """제품 업데이트"""
        if not self.pool:
            await self.initialize()
            if not self.pool:
                raise Exception("데이터베이스 연결 풀을 초기화할 수 없습니다.")
        
        try:
            async with self.pool.acquire() as conn:
                # 동적으로 업데이트할 필드들 구성
                update_fields = []
                values = []
                param_count = 1
                
                for field, value in update_data.items():
                    if value is not None and field != 'id':
                        update_fields.append(f"{field} = ${param_count}")
                        values.append(value)
                        param_count += 1
                
                if not update_fields:
                    raise Exception("업데이트할 데이터가 없습니다.")
                
                # updated_at 필드 추가
                update_fields.append("updated_at = NOW()")
                
                query = f"""
                    UPDATE product 
                    SET {', '.join(update_fields)}
                    WHERE id = ${param_count}
                    RETURNING *
                """
                values.append(product_id)
                
                result = await conn.fetchrow(query, *values)
                
                if result:
                    product_dict = dict(result)
                    # datetime.date 객체를 문자열로 변환
                    if 'prostart_period' in product_dict and product_dict['prostart_period']:
                        product_dict['prostart_period'] = product_dict['prostart_period'].isoformat()
                    if 'proend_period' in product_dict and product_dict['proend_period']:
                        product_dict['proend_period'] = product_dict['proend_period'].isoformat()
                    return product_dict
                else:
                    return None
                
        except Exception as e:
            logger.error(f"❌ 제품 업데이트 실패: {str(e)}")
            raise e

    async def delete_product(self, product_id: int) -> bool:
        """제품 삭제"""
        if not self.pool:
            await self.initialize()
            if not self.pool:
                raise Exception("데이터베이스 연결 풀을 초기화할 수 없습니다.")
        
        try:
            async with self.pool.acquire() as conn:
                result = await conn.execute("""
                    DELETE FROM product WHERE id = $1
                """, (product_id,))
                
                return result != "DELETE 0"
                
        except Exception as e:
            logger.error(f"❌ 제품 삭제 실패: {str(e)}")
            raise e

    async def get_products_by_install(self, install_id: int) -> List[Dict[str, Any]]:
        """사업장별 제품 목록 조회"""
        if not self.pool:
            await self.initialize()
            if not self.pool:
                raise Exception("데이터베이스 연결 풀을 초기화할 수 없습니다.")
        
        try:
            async with self.pool.acquire() as conn:
                results = await conn.fetch("""
                    SELECT * FROM product WHERE install_id = $1 ORDER BY id
                """, (install_id,))
                
                products = []
                for row in results:
                    product_dict = dict(row)
                    # datetime.date 객체를 문자열로 변환
                    if 'prostart_period' in product_dict and product_dict['prostart_period']:
                        product_dict['prostart_period'] = product_dict['prostart_period'].isoformat()
                    if 'proend_period' in product_dict and product_dict['proend_period']:
                        product_dict['proend_period'] = product_dict['proend_period'].isoformat()
                    products.append(product_dict)
                
                return products
                
        except Exception as e:
            logger.error(f"❌ 사업장별 제품 조회 실패: {str(e)}")
            raise e

    async def get_product_names(self) -> List[Dict[str, Any]]:
        """제품명 목록 조회 (드롭다운용)"""
        if not self.pool:
            await self.initialize()
            if not self.pool:
                raise Exception("데이터베이스 연결 풀을 초기화할 수 없습니다.")
        
        try:
            async with self.pool.acquire() as conn:
                results = await conn.fetch("""
                    SELECT id, product_name, product_category 
                    FROM product 
                    ORDER BY product_name
                """)
                
                return [dict(row) for row in results]
                
        except Exception as e:
            logger.error(f"❌ 제품명 목록 조회 실패: {str(e)}")
            raise e

    async def search_products(self, search_term: str) -> List[Dict[str, Any]]:
        """제품 검색"""
        if not self.pool:
            await self.initialize()
            if not self.pool:
                raise Exception("데이터베이스 연결 풀을 초기화할 수 없습니다.")
        
        try:
            async with self.pool.acquire() as conn:
                results = await conn.fetch("""
                    SELECT * FROM product 
                    WHERE product_name ILIKE $1 OR product_category ILIKE $1 OR goods_name ILIKE $1
                    ORDER BY product_name
                """, (f"%{search_term}%",))
                
                products = []
                for row in results:
                    product_dict = dict(row)
                    # datetime.date 객체를 문자열로 변환
                    if 'prostart_period' in product_dict and product_dict['prostart_period']:
                        product_dict['prostart_period'] = product_dict['prostart_period'].isoformat()
                    if 'proend_period' in product_dict and product_dict['proend_period']:
                        product_dict['proend_period'] = product_dict['proend_period'].isoformat()
                    products.append(product_dict)
                
                return products
                
        except Exception as e:
            logger.error(f"❌ 제품 검색 실패: {str(e)}")
            raise e
