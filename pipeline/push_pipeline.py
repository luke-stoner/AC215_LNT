import google.cloud.aiplatform as aip

aip.init(
    project='ac215-400221',
    location='us-east4',
)

# Prepare the pipeline job
job = aip.PipelineJob(
    display_name="lnt-pipeline",
    template_path='lnt-pipeline.yaml',
    pipeline_root='gs://models-lnt/pipeline',
    parameter_values={
        'project_id': 'ac215-400221'
    }
)

job.submit()