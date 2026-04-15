import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BudgetDocument = HydratedDocument<Budget>;

@Schema({ timestamps: true })
export class Budget {
  // Thuộc phòng nào
  @Prop({ type: Types.ObjectId, ref: 'Space', required: true })
  spaceId: Types.ObjectId;

  // Danh mục chi tiêu cần giới hạn
  @Prop({ type: Types.ObjectId, ref: 'Categoris', required: true })
  categoryId: Types.ObjectId;

  // Giới hạn chi tiêu (VND)
  @Prop({ required: true, min: 1 })
  limitAmount: number;

  // Tháng áp dụng (1-12)
  @Prop({ required: true, min: 1, max: 12 })
  month: number;

  // Năm áp dụng
  @Prop({ required: true })
  year: number;

  // Ngưỡng cảnh báo — mặc định [80, 100]
  // 80 = cảnh báo khi đạt 80%, 100 = cảnh báo khi vượt
  @Prop({ type: [Number], default: [80, 100] })
  alertThresholds: number[];

  createdAt: Date;
  updatedAt: Date;
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);
