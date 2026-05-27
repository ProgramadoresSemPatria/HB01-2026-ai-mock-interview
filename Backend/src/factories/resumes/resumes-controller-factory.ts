import { ResumesController } from "@/modules/resumes/controller/resumes-controller";
import { makeResumeService } from "./resume-service-factory";

export function makeResumesController(): ResumesController {
  return new ResumesController(makeResumeService());
}
