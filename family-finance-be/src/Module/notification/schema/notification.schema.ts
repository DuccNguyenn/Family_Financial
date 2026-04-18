import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export enum NotificationType {
  WARNING = 'WARNING',
  DANGER = 'DANGER',
  INFO = 'INFO',
}

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'Space', required: true })
  spaceId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    type: String,
    enum: Object.values(NotificationType),
    default: NotificationType.INFO,
  })
  type: NotificationType;

  // List of user IDs who have read this notification
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  isRead: Types.ObjectId[];

  // Optional link to navigate to when clicked
  @Prop({ type: String, default: null })
  actionLink: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
