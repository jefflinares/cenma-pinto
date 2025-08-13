'use client';

import { useActionState, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
// import { Product as ProductForm } from '@/lib/db/schema';
import ProductForm, { ActionState } from '@/components/ui/forms/product';
import useSWR, { mutate } from 'swr';
import { Suspense } from 'react';
import { ComboBoxWithModal } from '@/components/ui/comboBox';
import { addProduct, deleteProduct, updateProduct } from './actions';
import DataTable from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Product } from '@/lib/db/schema';
import { useToast } from '@/components/ui/toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());




export default function ProductsPage() {
  const { data: products, error, isLoading } = useSWR<Product[]>('/api/product', fetcher);
  // console.log("🚀 ~ ProductsPage ~ data:", products, 'isLoading: ', isLoading)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  // console.log("🚀 ~ ProductsPage ~ selectedProduct:", selectedProduct)
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Cambia la función de acción según el modo
  const actionFn = isEditing ? updateProduct : addProduct;
  const [initialState, setInitialState] = useState({});
  useEffect(() => {
    if (isEditing) {
      const initialState = isEditing && selectedProduct
        ? { id: selectedProduct.id, name: selectedProduct.name }
        : {};
      setInitialState(initialState);
    }
  }, [isEditing, selectedProduct]);

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    actionFn,
    initialState
  );

   const { addToast } = useToast();
  

  // Al finalizar la acción:
  useEffect(() => {
    if (state?.success) {
      mutate('/api/product'); // Refresca productos con SWR
      setIsModalOpen(false);
      setIsEditing(false);
      setSelectedProduct(null);
      console.log('limpiar estados')
      setInitialState({});
      addToast(isEditing ? 'Producto actualizado' : 'Producto agregado', 'success')
    }
  }, [state]);
  console.log("🚀 ~ ProductsPage ~ initialState:", initialState)


  // console.log("🚀 ~ ProductsPage ~ state:", state)


  /* useEffect(() => {
     // Fetch the products
     if(isPending) return
     const fetchProducts = async () => {
       const response = await fetch('/api/product');
       const data = await response.json();
       setProducts(data);
     };
 
     fetchProducts();
   }, [isPending]);
 */

  const addNewProductComponent = (state: ActionState, formAction: ((formData: FormData) => void | Promise<void>)) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Información del Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            formAction={formAction}
            state={state}
            isPending={isPending}
            isEditing={isEditing}
            setIsModalOpen={setIsModalOpen}
            setIsEditing={setIsEditing}
          />
        </CardContent>
      </Card>

    )
  }

const handleOnDelete = async (id: number) => {
  try {
    const formData = new FormData();
    formData.append('id', String(id));
    const response = await deleteProduct({id}, formData);
    console.log("🚀 ~ handleOnDelete ~ response:", response)
    addToast('Producto eliminado', 'success');
    mutate('/api/product');
  } catch (error) {
    console.error("Error deleting product:", error);
  }
}

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Productos
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Productos</CardTitle>
          <CardAction>
            <Button
              type="button"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              size="sm"
              onClick={() => setIsModalOpen(true)}
            // disabled={isPending}
            >
              Agregar nuevo Producto
            </Button>
          </CardAction>

        </CardHeader>
        <CardContent>
          <DataTable
            isLoading={isLoading}
            columns={[
              { header: 'Nombre', field: 'name' },
            ]}
            data={products ?? []}
            currentPage={1}
            totalItems={products?.length || 0}
            pageSize={10}
            onPageChange={() => { }}
            onEdit={(product) => { setSelectedProduct(product); setIsEditing(true); setIsModalOpen(true); console.log('product', product) }}
            onDelete={({ id }) => handleOnDelete(Number(id))}
          />
        </CardContent>
      </Card>
      {isModalOpen ?
        <Modal
          setIsModalOpen={setIsModalOpen}
        >
          {addNewProductComponent(isEditing ? selectedProduct as any as ActionState : state, formAction)}
        </Modal>
        : null}
    </section>
  );
}
