from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments, DataCollatorWithPadding
import pandas as pd

# Load the pre-trained model and tokenizer
model_name = "cardiffnlp/twitter-xlm-roberta-base-sentiment"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

#import labeled dataset 
df = pd.read_csv('output/initial_labels.csv')

#filter high-confidence examples based on predicted sentiment scores
high_confidence_df = df[
    (df['negative_score'] > 0.9) |
    (df['neutral_score'] > 0.9) |
    (df['positive_score'] > 0.9)
]

# Prepare the high-confidence examples for fine-tuning
high_confidence_texts = high_confidence_df['text'].tolist()
high_confidence_labels = high_confidence_df['predicted_sentiment'].tolist()

# Tokenize the high-confidence examples
tokenized_dataset = tokenizer(high_confidence_texts, padding=True, truncation=True, return_tensors="pt")

#define training arguments
training_args = TrainingArguments(
    output_dir="output/fine_tuned_BERT",
    evaluation_strategy="steps",
    eval_steps=500,
    save_steps=500,
    num_train_epochs=3,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    learning_rate=2e-5,
    save_total_limit=1,
    load_best_model_at_end=True)

# Define a data collator to format your data for training
data_collator = DataCollatorWithPadding(tokenizer)

# Initialize Trainer and fine-tune the model
trainer = Trainer(
    model=model,
    args=training_args,
    data_collator=data_collator,
    train_dataset=tokenized_dataset,
)

# Start fine-tuning
trainer.train()

# Save the fine-tuned model
trainer.save_model()
tokenizer.save_pretrained("output/sentiment_finetuned_model")