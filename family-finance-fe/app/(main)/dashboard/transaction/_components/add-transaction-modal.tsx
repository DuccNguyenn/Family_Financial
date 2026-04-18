"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "@phosphor-icons/react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createIncomeAction, updateIncomeAction, createExpenseAction, updateExpenseAction } from "@/lib/action";
import { toast } from "sonner";
import { ICategory } from "@/lib/category.api";
import { CreateIncomeDto, ITransaction } from "@/types";

const formSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Số tiền phải lớn hơn 0",
  }),
  categoryID: z.string().min(1, "Vui lòng chọn danh mục"),
  date: z.date(),
  description: z.string().optional(),
});

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: any[];
  editData?: ITransaction | null;
  type?: "income" | "expense";
}

export function AddTransactionModal({
  open,
  onOpenChange,
  categories,
  editData,
  type: propType = "income",
}: AddTransactionModalProps) {
  const [type, setType] = React.useState<"income" | "expense">(propType);
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      categoryID: "",
      date: new Date(),
      description: "",
    },
  });

  // Reset form when editData changes
  React.useEffect(() => {
    if (editData) {
      form.reset({
        amount: String(editData.amount),
        categoryID: editData.categoryID._id,
        date: new Date(editData.date),
        description: editData.description || "",
      });
      setType(editData.categoryID.type as "income" | "expense" || propType);
    } else {
      setType(propType);
      form.reset({
        amount: "",
        categoryID: "",
        date: new Date(),
        description: "",
      });
    }
  }, [editData, form, propType, open]);

  // Mutation for creating/updating transaction
  const mutation = useMutation({
    mutationFn: (values: CreateIncomeDto) => {
      if (type === "expense") {
        if (editData) return updateExpenseAction(editData._id, values);
        return createExpenseAction(values);
      } else {
        if (editData) return updateIncomeAction(editData._id, values);
        return createIncomeAction(values);
      }
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.message || (editData ? "Lỗi cập nhật" : "Lỗi tạo mới"));
        return;
      }
      toast.success(editData ? "Cập nhật thành công" : "Thêm giao dịch thành công");
      if (!editData) form.reset();
      queryClient.invalidateQueries({ queryKey: ["transactions", type] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      // Sau khi tạo/cập nhật expense, budget cần tính lại spentAmount ngay
      if (type === "expense") {
        queryClient.invalidateQueries({ queryKey: ["budgets"] });
      }
      onOpenChange(false);

    },
    onError: () => {
      toast.error("Lỗi kết nối đến máy chủ");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate({
      amount: Number(values.amount),
      categoryID: values.categoryID,
      date: format(values.date, "yyyy-MM-dd"),
      description: values.description,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl border-none">
        <DialogHeader className="p-6 pb-2 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/10">
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-white">
            {editData ? "Cập nhật giao dịch" : "Thêm giao dịch mới"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Loại giao dịch (Tabs) */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setType("expense");
                  form.setValue("categoryID", "");
                }}
                className={cn(
                  "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
                  type === "expense" 
                    ? "bg-white dark:bg-slate-700 text-red-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Chi phí
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("income");
                  form.setValue("categoryID", "");
                }}
                className={cn(
                  "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
                  type === "income" 
                    ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Thu nhập
              </button>
            </div>

            {/* Số tiền */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-slate-600 dark:text-slate-400 font-medium">Số tiền</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="0"
                        className="pl-4 pr-12 h-14 text-2xl font-bold text-slate-800 dark:text-white bg-slate-50 border-none rounded-xl focus-visible:ring-emerald-500/20"
                        {...field}
                        type="number"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                        VND
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Danh mục */}
              <FormField
                control={form.control}
                name="categoryID"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel className="text-slate-600 dark:text-slate-400 font-medium">Danh mục</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 border-slate-100 bg-slate-50 rounded-xl">
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-slate-100">
                        {categories
                          .filter((c) => c.type === type)
                          .map((cat) => (
                          <SelectItem key={cat._id} value={cat._id} className="cursor-pointer">
                            <div className="flex items-center gap-2">
                              <span>{cat.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Ngày */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }: { field: any }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-slate-600 dark:text-slate-400 font-medium h-[17px] mb-2">Ngày</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "h-12 pl-3 text-left font-normal bg-slate-50 border-slate-100 rounded-xl",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Chọn ngày</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-xl overflow-hidden shadow-xl" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                          locale={vi}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Ghi chú */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-slate-600 dark:text-slate-400 font-medium">Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nội dung giao dịch..."
                      className="resize-none min-h-[100px] border-slate-100 bg-slate-50 rounded-xl focus-visible:ring-emerald-500/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="rounded-xl font-medium"
                disabled={mutation.isPending}
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                className={`text-white rounded-xl px-8 font-medium shadow-md ${type === 'expense' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'}`}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Đang lưu..." : (editData ? "Cập nhật" : "Lưu giao dịch")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
