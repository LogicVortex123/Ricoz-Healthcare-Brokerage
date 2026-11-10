export function diligenceTemplate(
  category: string,
  purpose: string,
  legalStructure: string,
) {
  const entries = [
    ["authority", "Participant authority and representation", "authority"],
    ["financial", "Business financial statements and periods", "financial"],
    ["licence", "Professional and operating permissions", "licence"],
    ["consent", "Required owner and partner consents", "consent"],
    ...(category === "dental"
      ? [
          [
            "equipment",
            "Operatories and dental equipment inventory",
            "equipment",
          ],
        ]
      : category === "veterinary"
        ? [
            [
              "speciesFacilities",
              "Species, services and veterinary facility review",
              "other",
            ],
          ]
        : [
            [
              "clinicalScope",
              "Specialty, consultation and procedure facility review",
              "licence",
            ],
          ]),
    ...(purpose === "partnerRetirement"
      ? [
          [
            "partnerExit",
            "Partner exit obligations and retained liabilities",
            "consent",
          ],
        ]
      : purpose === "succession"
        ? [
            [
              "successionPlan",
              "Succession and operational continuity plan",
              "other",
            ],
          ]
        : purpose === "fullAcquisition"
          ? [
              [
                legalStructure === "assetTransfer"
                  ? "assetSchedule"
                  : "shareSchedule",
                "Reviewed acquisition scope and retained obligations",
                legalStructure === "assetTransfer" ? "terms" : "ownership",
              ],
            ]
          : []),
  ];
  return entries.map(([id, title, evidenceCategory]) => ({
    id,
    title,
    evidenceCategory,
    template: "healthcare-mvp-v2",
    category,
    purpose,
    mandatory: true,
    status: "open",
  }));
}
