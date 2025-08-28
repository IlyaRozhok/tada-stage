import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return "Hello World!";
  }

  @Get("health")
  health() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }
}
