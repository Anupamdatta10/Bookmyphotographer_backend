import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateContactSubmissionDto } from './dto/create-contact-submission.dto';
import { ContactService } from './contact.service';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a contact form message' })
  create(
    @Body() createContactSubmissionDto: CreateContactSubmissionDto,
  ): Promise<{ message: string }> {
    return this.contactService.create(createContactSubmissionDto);
  }
}
