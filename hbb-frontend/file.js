const { Controller } = require("react-hook-form");

<div
  className={`md:w-1/2 w-full px-4 h-[5rem] flex items-center justify-center text-center ${dropAreaStyle}`}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={(e) => handleDrop(e, control.getFieldState("video").field)}
  id="video-upload"
>
  {/* Conditional rendering based on dragging state */}
  {isDragging ? (
    <p className="text-base1 text-[0.70rem]">Drop the video here...</p>
  ) : (
    <p className="text-gray-500 text-[0.70rem]">
      Drag and drop file <span className="text-tertiary">here </span>
    </p>
  )}
</div>;

{
  /* File input field wrapped in a Controller for form registration */
}
<Controller
  control={control}
  name="video"
  render={({ field }) => (
    <div className="mx-auto w-3/5">
      <input
        id="video-upload"
        type="file"
        accept="video/*"
        {...field}
        className="bg-white hidden"
      />
      <label
        htmlFor="video-upload"
        className="bg-transparent border border-placeholderText text-placeholderText py-1 px-3 w-3/5 mx-auto md:mx-0 rounded-md h-[1.8rem]"
      >
        Promotional video
      </label>
    </div>
  )}
/>;
