'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { updateAccount } from '@/app/(login)/actions';
import { User } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';
import { ComboBoxWithModal } from '@/components/ui/comboBox';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  plate?: string;
  error?: string;
  success?: string;
};

type AccountFormProps = {
  state: ActionState;
  nameValue?: string;
  emailValue?: string;
};

function AccountForm({
  state,
  nameValue = '',
  emailValue = ''
}: AccountFormProps) {
  return (
    <>
      <div>
        <Label htmlFor="plate" className="mb-2">
          Placa
        </Label>
        <Input
          id="plate"
          name="plate"
          placeholder="Placa Camión"
          defaultValue={state.plate || nameValue}
          required
        />
      </div>
      <div>
        <Label htmlFor="owner" className="mb-2">
          Propietario
        </Label>
        <ComboBoxWithModal id="owner"/>
        {/* <Input
          id="owner"
          name="owner"
          type="text"
          placeholder="Ingrese el propietario"
          defaultValue={''}
          required
        /> */}
      </div>
    </>
  );
}

function AccountFormWithData({ state }: { state: ActionState }) {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  return (
    <AccountForm
      state={state}
      nameValue={user?.name ?? ''}
      emailValue={user?.email ?? ''}
    />
  );
}

export default function SalesPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateAccount,
    {}
  );

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Registrar Camión
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>VENTAS</CardTitle>
        </CardHeader>
        <CardContent>
         
        </CardContent>
      </Card>
    </section>
  );
}
