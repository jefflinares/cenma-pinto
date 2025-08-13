import React from 'react';
import { Label } from '../label';
import { Input } from '../input';
import { ComboBoxWithModal } from '../comboBox';

type ActionState = {
  plate?: string;
  owner?: string;
  error?: string;
  success?: string;
};

type TruckFormProps = {
  state: ActionState;
  plateValue?: string;
  ownerValue?: string;
};

function TruckForm({
  state,
  plateValue,
  ownerValue
}: TruckFormProps) {
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
          defaultValue={state.plate}
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

export default TruckForm;