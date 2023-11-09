import kfp
from kfp.v2 import dsl
from kfp.v2.dsl import component


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

# Define the pipeline
@dsl.pipeline(
    name='lnt-pipeline',
    description='LNT Pipeline that Scrapes, Labels, and Summarizes'
)

def lnt_pipeline(
    scrape: str,
    label: str,
    summarize: str
):
    # Run the first image
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

