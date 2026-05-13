import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CoursesService, CursoDto, TemaDto } from './courses.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('courses')
@UseGuards(AuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  getCourses(): Promise<CursoDto[]> {
    return this.coursesService.findAll();
  }

  @Get(':cursoId/topics')
  getTopics(@Param('cursoId', ParseIntPipe) cursoId: number): Promise<TemaDto[]> {
    return this.coursesService.findTopicsByCourse(cursoId);
  }
}
