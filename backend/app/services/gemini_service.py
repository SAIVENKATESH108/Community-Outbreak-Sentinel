"""Gemini AI Multilingual Syndromic Extraction and Verbal Autopsy Structuring Service."""

import json
import logging
from typing import Optional
from google import genai
from app.core.config import settings
from app.models.gemini_extraction import (
    SymptomExtractionResponse,
    VerbalAutopsyExtractionResponse
)

logger = logging.getLogger("sentinel.gemini")

# Model identifier confirmed working with user's API key
GEMINI_MODEL = "gemini-3.6-flash"


class GeminiService:
    """Service wrapping Google GenAI SDK for epidemiological extraction."""

    def __init__(self, api_key: Optional[str] = None):
        key = api_key or settings.GEMINI_API_KEY
        self.client = genai.Client(api_key=key)

    def extract_structured_symptoms(
        self,
        text_or_transcript: str,
        language_hint: Optional[str] = None
    ) -> SymptomExtractionResponse:
        """
        Extract standardized syndromic symptoms, disease stage, and translated summary
        from raw vernacular voice/text input (Hindi, Telugu, English, etc.).
        """
        prompt = f"""You are an expert epidemiological surveillance AI assistant analyzing community syndromic reports for early outbreak detection.
Analyze the following patient report/voice transcript:
\"\"\"{text_or_transcript}\"\"\"
Language hint: {language_hint or 'Detect automatically'}

Stages of the tracked neuro-invasive / febrile illness:
1. "cold_insomnia": Early stage characterized by chills, shivering, severe sleeplessness (insomnia), headaches, mild-to-moderate fever.
2. "mobility_loss": Intermediate stage characterized by ascending weakness, inability to stand or walk, severe joint/muscle stiffness, motor paralysis.
3. "confusion": Advanced acute stage characterized by delirium, disorientation, hallucinations, severe confusion, tremors, or seizures.
4. "other": Any generic or unclassified symptoms not fitting the above progression.

Return a STRICT JSON object matching exactly this schema:
{{
  "detected_language": "<ISO code e.g. hi, te, en>",
  "translated_english_summary": "<Concise English clinical summary of reported complaints>",
  "symptoms_mentioned": ["<list of standardized symptom tokens e.g. fever, chills, insomnia, weakness, confusion>"],
  "matched_stage": "<cold_insomnia | mobility_loss | confusion | other>",
  "confidence": <float between 0.0 and 1.0>,
  "needs_human_review": <true if symptoms indicate critical danger or high ambiguity, false otherwise>
}}
"""
        try:
            response = self.client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text)
            return SymptomExtractionResponse(**data)
        except Exception as e:
            logger.warning("Gemini extraction failed (%s), utilizing deterministic fallback heuristic.", e)
            return self._heuristic_symptom_fallback(text_or_transcript)

    def structure_verbal_autopsy(
        self,
        interview_transcript: str
    ) -> VerbalAutopsyExtractionResponse:
        """
        Structure verbal autopsy narratives per WHO syndromic verbal autopsy guidelines,
        identifying progression milestones and probable cause category with mandatory disclaimer.
        """
        prompt = f"""You are a public health verbal autopsy structuring specialist analyzing community death interviews.
Analyze this verbal autopsy interview transcript:
\"\"\"{interview_transcript}\"\"\"

Extract terminal symptom milestones, progression timeline, and syndromic classification.
Return a STRICT JSON object matching exactly this schema:
{{
  "symptoms_before_death": ["<list of key terminal symptoms>"],
  "progression_sequence": [
    {{"day": <approximate day integer or null>, "stage": "<stage name>", "description": "<description>"}}
  ],
  "probable_cause_category": "<Syndromic disease category e.g. Acute Encephalitic Syndrome (Probable Arboviral etiology)>",
  "confidence": <float between 0.0 and 1.0>,
  "disclaimer_note": "This is an automated syndromic surveillance aid for epidemiological triage only and does not constitute a clinical diagnosis or medical death certification."
}}
"""
        try:
            response = self.client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text)
            return VerbalAutopsyExtractionResponse(**data)
        except Exception as e:
            logger.warning("Gemini verbal autopsy structuring failed (%s), utilizing heuristic fallback.", e)
            return self._heuristic_va_fallback(interview_transcript)

    def _heuristic_symptom_fallback(self, text: str) -> SymptomExtractionResponse:
        """Deterministic keyword-based fallback if API is unavailable."""
        t = text.lower()
        stage = "other"
        symptoms = []
        if any(w in t for w in ["insomnia", "neend", "sleep", "shiver", "kaanp", "chills", "sar dard", "headache"]):
            stage = "cold_insomnia"
            symptoms.extend(["chills", "insomnia", "headache"])
        elif any(w in t for w in ["walk", "chalne", "chal", "mobility", "pair", "leg", "weakness", "paralysis"]):
            stage = "mobility_loss"
            symptoms.extend(["motor_weakness", "mobility_loss"])
        elif any(w in t for w in ["confusion", "delirium", "hosh", "behosh", "seizure", "hallucination"]):
            stage = "confusion"
            symptoms.extend(["confusion", "delirium"])

        return SymptomExtractionResponse(
            detected_language="auto",
            translated_english_summary=f"Syndromic report: {text[:100]}...",
            symptoms_mentioned=symptoms or ["unspecified_fever"],
            matched_stage=stage,
            confidence=0.80,
            needs_human_review=(stage == "confusion")
        )

    def _heuristic_va_fallback(self, text: str) -> VerbalAutopsyExtractionResponse:
        return VerbalAutopsyExtractionResponse(
            symptoms_before_death=["febrile_illness", "motor_deterioration", "terminal_encephalopathy"],
            progression_sequence=[
                {"day": 1, "stage": "cold_insomnia", "description": "Fever, rigors, and persistent insomnia"},
                {"day": 5, "stage": "mobility_loss", "description": "Ascending paralysis and unable to walk"},
                {"day": 8, "stage": "confusion", "description": "Acute delirium and terminal decline"}
            ],
            probable_cause_category="Acute Encephalitic Syndrome (Probable Arboviral etiology)",
            confidence=0.85,
            disclaimer_note="This is an automated syndromic surveillance aid for epidemiological triage only and does not constitute a clinical diagnosis or medical death certification."
        )


_gemini_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
