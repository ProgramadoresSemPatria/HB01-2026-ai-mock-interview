import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const sttMock = vi.hoisted(() => ({
  transcribe: vi.fn(async () => ({
    text: "hello world",
    languageCode: "en",
    languageConfidence: 0.95,
  })),
}));

vi.mock("@/factories/transcribe/speech-to-text-factory", () => ({
  createAssemblyAiSpeechToText: () => sttMock,
}));

import type { Express } from "express";
import request from "supertest";

import { createApp } from "@/config/app";
import { env } from "@/config/env";
import prisma from "@/infrastructure/database";
import {
  authHeader,
  seedAuthenticatedUser,
} from "@/test/helpers/auth-helpers";
import { truncateTables } from "@/test/containers/truncate-tables";

const smallAudioBuffer = Buffer.from("small audio fixture");

async function authenticate(): Promise<string> {
  const auth = await seedAuthenticatedUser();
  return auth.accessToken;
}

describe("Transcribe API E2E", () => {
  let app: Express;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    sttMock.transcribe.mockClear();
    await truncateTables();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/transcribe/", () => {
    it("returns 401 without authentication", async () => {
      const response = await request(app)
        .post("/api/transcribe/")
        .attach("audio", smallAudioBuffer, {
          filename: "recording.webm",
          contentType: "audio/webm",
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Authentication required",
      });
      expect(sttMock.transcribe).not.toHaveBeenCalled();
    });

    it("returns a snake_case transcription response for audio", async () => {
      const token = await authenticate();

      const response = await request(app)
        .post("/api/transcribe/")
        .set(authHeader(token))
        .attach("audio", smallAudioBuffer, {
          filename: "recording.webm",
          contentType: "audio/webm",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        text: "hello world",
        language_code: "en",
        language_confidence: 0.95,
      });
      expect(sttMock.transcribe).toHaveBeenCalledWith({
        audio: smallAudioBuffer,
        mimeType: "audio/webm",
      });
    });

    it("returns 400 when no audio file is attached", async () => {
      const token = await authenticate();

      const response = await request(app)
        .post("/api/transcribe/")
        .set(authHeader(token));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Audio file is required",
      });
      expect(sttMock.transcribe).not.toHaveBeenCalled();
    });

    it("returns 400 when audio exceeds the maximum allowed size", async () => {
      const token = await authenticate();
      const oversizedAudio = Buffer.alloc(env.TRANSCRIBE_MAX_BYTES + 1);

      const response = await request(app)
        .post("/api/transcribe/")
        .set(authHeader(token))
        .attach("audio", oversizedAudio, {
          filename: "large-recording.webm",
          contentType: "audio/webm",
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "File exceeds maximum allowed size",
      });
      expect(sttMock.transcribe).not.toHaveBeenCalled();
    });
  });
});
