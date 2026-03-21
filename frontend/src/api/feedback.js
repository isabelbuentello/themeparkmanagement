import { withMockDelay } from './mockDelay'

export async function submitReview(reviewForm) {
  return withMockDelay({
    ok: true,
    message: 'Review submitted for the customer experience feed.',
    submission: reviewForm
  })
}

export async function submitComplaint(complaintForm) {
  return withMockDelay({
    ok: true,
    message: 'Complaint submitted for follow-up review.',
    submission: complaintForm
  })
}
