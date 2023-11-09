import kfp
from kfp import component, dsl, compiler
from google.cloud import aiplatform
from google_cloud_pipeline_components import v1

project_id = 'ac215-400221'
pipeline_root_path = 'gs://models-lnt/pipeline'

# Define a component for each step in the pipeline
@component
def run_image_step(
    name: str,
    image_uri: str
):
    return dsl.ContainerOp(
       name=name,
       image=image_uri
    )


# Define the workflow of the pipeline.
@kfp.dsl.pipeline(
    name="lnt-pipeline",
    pipeline_root=pipeline_root_path)

def pipeline(project_id: str):
    first_step = run_image_step(
       name='scrape',
       image_uri='us-east4-docker.pkg.dev/ac215-400221/lnt-repository/lnt-scrape:1.0.0'
    )

    # Run the second image after the first
    second_step = run_image_step(
       name='label',
       image_uri='us-east4-docker.pkg.dev/ac215-400221/lnt-repository/lnt-label:1.1.5'
    ).after(first_step)

    # Run the third image after the second
    third_step = run_image_step(
       name='summarize',
       image_uri='us-east4-docker.pkg.dev/ac215-400221/lnt-repository/lnt-summarize:1.0.0'
    ).after(second_step)


# Compile the pipeline
compiler.Compiler().compile(
    pipeline_func=pipeline,
    package_path='lnt-pipeline.yaml'
)