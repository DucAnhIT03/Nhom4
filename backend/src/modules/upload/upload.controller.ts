import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { AuthGuard } from "../../common/guards/auth.guard";
import { uploadToCloudinary, deleteFromCloudinary } from "../../shared/providers/cloudinary.provider";
import type { UploadedFile as UploadedFileType } from "../../shared/providers/cloudinary.provider";

@ApiTags("Upload file")
@Controller("upload")
@UseGuards(AuthGuard)
@ApiBearerAuth("access-token")
export class UploadController {
  @ApiOperation({ summary: "Upload một file đơn lẻ lên Cloudinary" })
  @Post("single")
  @UseInterceptors(FileInterceptor("file"))
  async uploadSingle(@UploadedFile() file: UploadedFileType) {
    const result = await uploadToCloudinary(file);
    return {
      publicId: result.publicId,
      url: result.url,
    };
  }

  @ApiOperation({ summary: "Upload nhiều file lên Cloudinary" })
  @Post("multiple")
  @UseInterceptors(FilesInterceptor("files"))
  async uploadMultiple(@UploadedFiles() files: UploadedFileType[]) {
    const results = await Promise.all(files.map((file) => uploadToCloudinary(file)));

    return results.map((r) => ({
      publicId: r.publicId,
      url: r.url,
    }));
  }

  @ApiOperation({ summary: "Xóa file trên Cloudinary theo publicId" })
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Body("publicId") publicId: string) {
    await deleteFromCloudinary(publicId);
  }
}


