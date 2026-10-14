import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { TOOLS } from "../tools";

// The tool registry in lib/tools.ts is the single source of truth, but a few
// lists are still written by hand and silently drifted when the URL encoder
// landed (issue #153): the README gallery and list, package.json's description
// and keywords, and the hand-written share images in .github/assets. These
// assertions keep those copies in step with the registry.

const root = resolve(__dirname, "../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const urlEncoder = TOOLS.find((t) => t.slug === "url-encoder")!;

describe("hand-written lists stay in step with the tool registry", () => {
  describe("README.md", () => {
    const readme = read("README.md");

    it("links every tool in the registry's own order", () => {
      const positions = TOOLS.map((t) =>
        readme.indexOf(`https://tools.codercops.com${t.path}`)
      );
      // Every tool is linked...
      positions.forEach((pos, i) => {
        expect(pos, `${TOOLS[i].slug} is missing from README.md`).toBeGreaterThan(-1);
      });
      // ...and the first mention of each is in registry order.
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
    });

    it("shows one gallery image per tool, named og-<slug>.png", () => {
      for (const tool of TOOLS) {
        expect(readme).toContain(`./.github/assets/og-${tool.slug}.png`);
      }
    });

    it("has a list entry for every tool", () => {
      for (const tool of TOOLS) {
        expect(readme).toContain(`**[${tool.title}](https://tools.codercops.com${tool.path}).**`);
      }
    });
  });

  describe("package.json", () => {
    const pkg = JSON.parse(read("package.json")) as {
      description: string;
      keywords: string[];
    };

    it("names the URL encoder in the description", () => {
      expect(pkg.description.toLowerCase()).toContain("url encoder");
    });

    it("keeps url-encoder in the keywords, in registry order", () => {
      const slugs = TOOLS.map((t) => t.slug);
      const present = pkg.keywords.filter((k) => slugs.includes(k));
      expect(present).toEqual(slugs);
    });
  });

  describe(".github/assets", () => {
    it("ships a 1200x630 share image for every tool", () => {
      for (const tool of TOOLS) {
        const png = readFileSync(resolve(root, `.github/assets/og-${tool.slug}.png`));
        // PNG magic, then the IHDR width/height as big-endian uint32.
        expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
        expect(png.readUInt32BE(16)).toBe(1200);
        expect(png.readUInt32BE(20)).toBe(630);
      }
    });
  });

  describe("the URL encoder registry entry", () => {
    it("exists, since these lists are built from it", () => {
      expect(urlEncoder).toBeDefined();
      expect(urlEncoder.path).toBe("/url-encoder");
    });
  });
});
