export const DEMO_CONTEXT = `I'm building a transformer-based text classifier for medical notes.
I use a BERT backbone with a classification head, fine-tuned on labeled EHR (electronic health record) data.
My current challenge is handling class imbalance — rare diagnoses are heavily underrepresented.
I'm also experimenting with data augmentation strategies like synonym replacement and back-translation.`

export const DEMO_ANALYSIS = {
  paper_summary: {
    title: "Focal Loss for Dense Object Detection",
    main_contribution: "Introduces Focal Loss, a dynamically-scaled cross-entropy function that down-weights easy examples and focuses training on hard negatives. This reshapes the standard cross-entropy loss so that well-classified examples contribute less to the total loss, enabling effective learning from rare, difficult-to-classify examples even in severely imbalanced datasets.",
    methods_used: ["Focal Loss", "RetinaNet", "Feature Pyramid Network (FPN)", "ResNet backbone", "Alpha class weighting"],
    key_findings: [
      "Focal Loss outperforms standard cross-entropy on severely class-imbalanced datasets",
      "RetinaNet with Focal Loss matches or exceeds two-stage detectors like Faster R-CNN",
      "The gamma parameter controls the strength of down-weighting for easy examples",
      "Class imbalance — not model architecture — is identified as the root cause of one-stage detector underperformance",
    ],
    domain: "computer vision",
  },
  relevance: {
    relevance_score: 8,
    relevance_reasoning:
      "Focal Loss directly addresses class imbalance during training, which is your stated primary challenge with rare diagnoses in EHR data. While originally developed for object detection, the loss function is model-agnostic and has been widely adopted in NLP text classification tasks with skewed label distributions.",
    applicable_areas: [
      "Loss function for BERT classification head",
      "Handling rare diagnosis classes in EHR data",
      "Training stability with imbalanced label distributions",
    ],
    concept_mappings: [
      { paper_concept: "Focal Loss", user_pipeline_equivalent: "Cross-entropy loss on your classification head" },
      { paper_concept: "Easy vs hard negatives", user_pipeline_equivalent: "Common diagnoses vs rare diagnoses" },
      { paper_concept: "Gamma (focusing parameter)", user_pipeline_equivalent: "Tunable imbalance hyperparameter for your label distribution" },
      { paper_concept: "Alpha (class weighting term)", user_pipeline_equivalent: "Per-class weights in your existing training config" },
    ],
  },
  suggestions: [
    {
      title: "Replace cross-entropy with Focal Loss",
      description:
        "Swap your classification head's loss from standard cross-entropy to Focal Loss. In PyTorch this is roughly 10 lines — use torchvision.ops.sigmoid_focal_loss or implement it directly. Start with gamma=2.0 and alpha=0.25 (the paper's defaults), then tune gamma on your validation set. Expect the biggest gains on your rarest diagnosis classes.",
      difficulty: "easy",
      caveats:
        "Focal Loss was validated on vision tasks. On text classification, gains are real but typically smaller. Monitor that common-class accuracy doesn't degrade while rare-class recall improves.",
    },
    {
      title: "Combine with your existing augmentation strategy",
      description:
        "Run Focal Loss alongside your synonym replacement and back-translation augmentation rather than replacing it. The two approaches attack class imbalance from different angles — augmentation increases rare-class sample count while Focal Loss reweights gradient updates. Track per-class F1 separately to measure which contributes more.",
      difficulty: "medium",
      caveats:
        "You may need to re-tune augmentation rates once Focal Loss is active, since it changes the effective training signal from augmented samples.",
    },
    {
      title: "Sweep the gamma focusing parameter",
      description:
        "The gamma parameter is sensitive to your specific label distribution skew. Add it to your hyperparameter sweep (try 0.5, 1.0, 2.0, 5.0). Log per-class precision and recall at each value — you'll likely find a clear elbow where rare-class recall improves without sacrificing common-class accuracy.",
      difficulty: "medium",
      caveats: "Doubles or triples sweep compute. Run a coarse search first, then fine-grained tuning around the best value.",
    },
    {
      title: "Benchmark alpha-only weighting first",
      description:
        "Before implementing full Focal Loss, test alpha-weighted cross-entropy (static class weighting only) as a simpler baseline. This isolates how much benefit comes from static weighting vs dynamic focusing. If alpha-only matches full Focal Loss on your data, you save engineering complexity.",
      difficulty: "easy",
      caveats:
        "Alpha weighting is equivalent to sklearn's class_weight='balanced'. You may already have this — check your existing training config before building anything new.",
    },
  ],
}
