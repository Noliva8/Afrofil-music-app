

export default function TestUploadProgressTracker ({
 uploadState,  subscriptionLoading,  subscriptionError, subscriptionData
}) {



  if (subscriptionLoading) return <p>Waiting for upload to begin...</p>;
  if (subscriptionError) return <p>subscriptionError: {subscriptionError.message}</p>;

  const progress = subscriptionData?.songUploadProgress;

  return (
    <div>
      <p>Step: {progress.step}</p>
      <p>Status: {progress.status}</p>
      <p>Message: {progress.message}</p>
      <p>Progress: {progress.percent}%</p>
      {progress.isComplete && <p>✅ Upload process complete</p>}
    </div>
  );
}
