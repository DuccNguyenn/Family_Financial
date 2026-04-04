import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateSpaceDto, JoinSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { Model, Types } from 'mongoose';
import { Space, SpaceDocument } from '@/Module/space/schema/space.schema';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '@/Module/users/schema/user.shcema';
import { JwtService } from '@nestjs/jwt';
interface JwtPayload {
  sub: string;
  accountId: string;
  username: string;
  spaceId: string;
  role: 'parent' | 'member';
}
@Injectable()
export class SpaceService {
  constructor(
    @InjectModel(Space.name) private spaceModel: Model<SpaceDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  // Sinh ra mã mời ngẫu nhiên có 6 kí tự
  private generateInviteCode(): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  //Sinh mã mời không bị trùng trong database
  private async generateUniqueInviteCode(): Promise<string> {
    let code: string;
    let isUnique = false;
    do {
      code = this.generateInviteCode();
      const existingSpace = await this.spaceModel.findOne({
        invitedCode: code,
      });
      if (!existingSpace) {
        isUnique = true;
      }
    } while (!isUnique);
    return code;
  }

  private async signNewToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync({
      sub: payload.sub,
      accountId: payload.accountId,
      username: payload.username,
      spaceId: payload.spaceId,
      role: payload.role,
    });
  }

  //Tạo phòng => userId= người tạo sẽ tự đọng thành parent
  async createSpace(
    dto: CreateSpaceDto,
    userId: string,
    accountId: string,
    email: string,
  ) {
    // Kiểm tra user tồn tại
    const user = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException('Không tìm thấy user');
    if (user.spaceId) throw new BadRequestException('Bạn đã thuộc 1 phòng rồi');

    const invitedCode = await this.generateUniqueInviteCode();

    // Tạo Space
    const space = await this.spaceModel.create({
      name: dto.name,
      membersId: [new Types.ObjectId(userId)],
      invitedCode,
      alertThresholds: dto.alertThresholds ?? [80, 100],
      createdBy: new Types.ObjectId(userId),
    });

    // Cập nhật User: spaceId + role = parent
    await this.userModel.updateOne(
      { _id: userId },
      { spaceId: space._id, role: 'parent' },
    );

    // Ký JWT mới — có spaceId + role=parent
    // FE nhận token này, set cookie → không cần login lại
    const access_token = await this.signNewToken({
      sub: userId,
      accountId,
      username: email,
      spaceId: space._id.toString(),
      role: 'parent',
    });

    return {
      _id: space._id,
      name: space.name,
      inviteCode: space.invitedCode,
      role: 'parent',
      access_token, // ← JWT mới trả về luôn
      user: {
        _id: userId,
        name: user.name,
        email,
        avatar: user.avatar ?? null,
        spaceId: space._id.toString(),
        role: 'parent',
        accountId,
      },
    };
  }

  //Vào phòng bằng mã mờ => role = member
  async joinSpace(
    dto: JoinSpaceDto,
    userId: string,
    accountId: string,
    email: string,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException('Không tìm thấy user');
    if (user.spaceId) throw new BadRequestException('Bạn đã thuộc 1 phòng rồi');

    // Tìm phòng theo mã mời
    const space = await this.spaceModel.findOne({
      invitedCode: dto.invitedCode.toUpperCase(),
    });
    if (!space)
      throw new BadRequestException('Mã mời không hợp lệ hoặc đã hết hạn');

    // Thêm userId vào memberIds
    await this.spaceModel.updateOne(
      { _id: space._id },
      { $addToSet: { membersId: new Types.ObjectId(userId) } },
    );

    // Cập nhật User: spaceId + role = member
    await this.userModel.updateOne(
      { _id: userId },
      { spaceId: space._id, role: 'member' },
    );

    // Ký JWT mới — có spaceId + role=member
    const access_token = await this.signNewToken({
      sub: userId,
      accountId,
      username: email,
      spaceId: space._id.toString(),
      role: 'member',
    });

    return {
      _id: space._id,
      name: space.name,
      inviteCode: space.invitedCode,
      role: 'member',
      access_token, // ← JWT mới trả về luôn
      user: {
        _id: userId,
        name: user.name,
        email,
        avatar: user.avatar ?? null,
        spaceId: space._id.toString(),
        role: 'member',
        accountId,
      },
    };
  }

  // Láy thông tin phòng
  async getMySpace(spaceId: string) {
    const space = await this.spaceModel
      .findById(spaceId)
      .populate('membersId', 'name avatar role')
      .populate('createdBy', 'name')
      .lean();

    if (!space) throw new BadRequestException('Không tìm thấy phòng');
    return space;
  }

  //Cập nhập thông tin phòng
  async updateSpace(dto: UpdateSpaceDto, spaceId: string, role: string) {
    if (role != 'parent') {
      throw new BadRequestException(
        'Bạn không có quyền cập nhập thông tin phòng',
      );
    }
    return this.spaceModel.findByIdAndUpdate(spaceId, dto, { new: true });
  }

  //Phân quyền cho các thành viên chỉ role parent mời làm được
  async changeMemberRole(
    memberId: string,
    newRole: 'parent' | 'member',
    spaceId: string,
    currentUserId: string,
    role: string,
  ) {
    if (role != 'parent') {
      throw new ForbiddenException('Chỉ quản lý mới được đổi role');
    }
    if (memberId == currentUserId) {
      throw new BadRequestException('Không thể đổi role của chính mình');
    }

    const member = await this.userModel.findOne({
      _id: memberId,
      spaceId: new Types.ObjectId(spaceId),
    });

    if (!member)
      throw new BadRequestException('Thành viên không thuộc phòng này');

    await this.userModel.updateOne({ _id: memberId }, { role: newRole });
    return {
      message: `Cập nhập role thành công ${newRole}`,
    };
  }
  // Xóa thành viên trong gia đình (Chỉ parent)
  async removeMember(
    memberId: string,
    spaceId: string,
    currentUserId: string,
    role: string,
  ) {
    if (role !== 'parent') {
      throw new ForbiddenException('Chỉ quản lý mới được xóa thành viên');
    }
    if (memberId === currentUserId) {
      throw new BadRequestException('Không thể tự xóa mình khỏi phòng');
    }

    // Xóa khỏi memberIds của Space
    await this.spaceModel.updateOne(
      { _id: spaceId },
      { $pull: { membersId: new Types.ObjectId(memberId) } },
    );

    // Reset spaceId + role của User về null
    await this.userModel.updateOne(
      { _id: memberId },
      { spaceId: null, role: null },
    );

    return { message: 'Đã xóa thành viên khỏi phòng' };
  }
}
