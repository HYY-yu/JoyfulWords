import test from "node:test"
import assert from "node:assert/strict"
import { renderToStaticMarkup } from "react-dom/server"
import { PresentationFlowStepper } from "./presentation-flow-stepper"

const labels = ["Storycard", "Template", "Generating", "Complete"]

test("locks every step after a generation has started", () => {
  const markup = renderToStaticMarkup(
    <PresentationFlowStepper
      currentStep={3}
      labels={labels}
      highestReachableStep={3}
      navigationLocked
      onStepChange={() => undefined}
    />
  )

  assert.equal(markup.match(/ disabled=""/g)?.length, labels.length)
})

test("keeps reached steps interactive before generation starts", () => {
  const markup = renderToStaticMarkup(
    <PresentationFlowStepper
      currentStep={1}
      labels={labels}
      highestReachableStep={1}
      onStepChange={() => undefined}
    />
  )

  assert.equal(markup.match(/ disabled=""/g)?.length, 2)
})
