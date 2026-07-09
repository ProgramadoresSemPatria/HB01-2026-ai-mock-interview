import type { UserRepository } from "@/modules/auth/repository/user-repository";
import type { InterviewLocale } from "@/shared";

export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async updateInterviewLocale(
    userId: number,
    locale: InterviewLocale,
  ): Promise<{ interviewLocale: InterviewLocale }> {
    await this.userRepository.updateInterviewLocale(userId, locale);
    return { interviewLocale: locale };
  }
}
