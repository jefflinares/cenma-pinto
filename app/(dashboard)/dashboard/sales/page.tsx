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
          <CardTitle>Información del Camión</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={formAction}>
            <Suspense fallback={<AccountForm state={state} />}>
              <AccountFormWithData state={state} />
            </Suspense>
            {state.error && (
              <p className="text-red-500 text-sm">{state.error}</p>
            )}
            {state.success && (
              <p className="text-green-500 text-sm">{state.success}</p>
            )}
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Registrar Camión'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
