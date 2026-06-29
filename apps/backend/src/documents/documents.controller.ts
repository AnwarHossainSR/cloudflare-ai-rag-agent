import {
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserData } from '../auth/strategies/jwt.strategy';
import { DocumentsService, UploadedFileMeta } from './documents.service';

type UploadedBufferFile = UploadedFileMeta & { buffer: Buffer };

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: CurrentUserData,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /(text\/plain|text\/markdown|application\/octet-stream)/,
          }),
        ],
      }),
    )
    file: UploadedBufferFile,
  ) {
    const doc = await this.documents.create(user.userId, file);
    await this.documents.processInline(doc, file.buffer);
    return this.documents.findOneForUser(user.userId, doc.id);
  }

  @Get()
  findAll(@CurrentUser() user: CurrentUserData) {
    return this.documents.findAllForUser(user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.documents.findOneForUser(user.userId, id);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    await this.documents.remove(user.userId, id);
    return { deleted: true };
  }
}
