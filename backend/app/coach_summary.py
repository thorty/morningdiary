from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Protocol

SummaryLanguage = Literal["de", "en"]


COACH_SUMMARY_UNAVAILABLE_NOTE = "Deine Zusammenfassung konnte heute nicht erstellt werden."


@dataclass(frozen=True)
class CoachSummaryRequest:
    answers: list[int | str | None]
    target_language: SummaryLanguage


class CoachSummaryGenerator(Protocol):
    def generate(self, request: CoachSummaryRequest) -> str | None:
        ...


class OpenAICoachSummaryGenerator:
    def __init__(self, api_key: str, model: str = "gpt-4o-mini") -> None:
        from openai import OpenAI

        self._client = OpenAI(api_key=api_key)
        self._model = model

    def generate(self, request: CoachSummaryRequest) -> str | None:
        language_name = "Deutsch" if request.target_language == "de" else "English"
        answer_lines = []
        for index, answer in enumerate(request.answers, start=1):
            rendered = "(leer)" if answer is None else str(answer)
            answer_lines.append(f"Frage {index}: {rendered}")

        prompt = (
            "Du bist ein unterstuetzender Morning Coach. "
            "Schreibe eine kurze, warmherzige, nicht-klinische Reflexion in maximal 4 Saetzen. "
            "Nutze ausschliesslich die bereitgestellten Antworten. "
            "Erfinde keine Fakten, stelle keine Diagnosen und gib keine medizinischen oder psychotherapeutischen Ratschlaege. "
            f"Antworte in {language_name}."
        )
        user_input = "\n".join(answer_lines)
        response = self._client.responses.create(
            model=self._model,
            input=[
                {
                    "role": "system",
                    "content": prompt,
                },
                {
                    "role": "user",
                    "content": user_input,
                },
            ],
            max_output_tokens=180,
        )

        text = response.output_text.strip()
        if text:
            return text
        return None


def detect_predominant_answer_language(answers: list[int | str | None]) -> SummaryLanguage:
    german_score = 0
    english_score = 0

    german_markers = (
        " und ",
        " ich ",
        " heute ",
        " dank",
        " nicht ",
        " fuer ",
        " mit ",
        " loslassen",
    )
    english_markers = (
        " and ",
        " i ",
        " today ",
        " grateful",
        " not ",
        " with ",
        " let go",
        " energy",
    )

    for answer in answers:
        if not isinstance(answer, str):
            continue

        lower = f" {answer.lower()} "
        if any(marker in lower for marker in german_markers):
            german_score += 1
        if any(marker in lower for marker in english_markers):
            english_score += 1
        if any(character in answer for character in ("ae", "oe", "ue", "ss")):
            german_score += 1

    if english_score > german_score:
        return "en"
    return "de"
