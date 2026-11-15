import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";

import { Input } from "@shared/ui/inputs";
import { Toggle } from "@shared/ui/toggles";

export interface CreateIncomeCategoryFormData {
  title: string;
  excludedFromStatistics: boolean;
  excludedFromBalance: boolean;
}

export const createIncomeCategoryFormSchema = z.object({
  title: z.string().nonempty(),
  excludedFromStatistics: z.boolean(),
  excludedFromBalance: z.boolean(),
});

export const CreateIncomeCategoryFormFieldset = () => {
  const { register, control, watch } =
    useFormContext<CreateIncomeCategoryFormData>();
  const excludedFromStatistics = watch("excludedFromStatistics");
  return (
    <div className="flex flex-col gap-6">
      <Input
        label="Title"
        placeholder="e.g. Salary, Dividends, ..."
        required
        {...register("title")}
      />
      <Controller
        control={control}
        name="excludedFromStatistics"
        render={({ field: { value, onChange } }) => (
          <div className="flex items-center justify-between gap-3 px-4">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-text">
                Не учитывать в статистике
              </span>
              <span className="text-xs text-subtext0">
                Суммы попадут в блок «Вне статистики»
              </span>
            </div>
            <Toggle checked={value ?? false} onChange={onChange} />
          </div>
        )}
      />
      {excludedFromStatistics && (
        <Controller
          control={control}
          name="excludedFromBalance"
          render={({ field: { value, onChange } }) => (
            <div className="flex items-center justify-between gap-3 px-4">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-text">
                  Справочная категория
                </span>
                <span className="text-xs text-subtext0">
                  Записи не двигают и балансы счетов
                </span>
              </div>
              <Toggle checked={value ?? false} onChange={onChange} />
            </div>
          )}
        />
      )}
    </div>
  );
};
