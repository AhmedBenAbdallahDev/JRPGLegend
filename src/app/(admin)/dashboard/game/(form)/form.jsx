"use client"
import { useFormState, useFormStatus } from "react-dom";
import { createGame, deleteFormAction } from "@/app/(admin)/dashboard/game/(form)/actions"
import { PhotoIcon, ArchiveBoxIcon } from "@heroicons/react/24/outline";

const initialState = { message: null }

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit"
      aria-disabled={pending}
      className="w-full text-white bg-yellow-500 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
        {pending ? "Saving..." : "Save"}
    </button>
  )
}

export default function GameForm({categories, game}) {
  const [state, formAction] = useFormState(createGame, initialState);

  return (
    <div>
      {state.message && (
        <p className={`text-sm mb-4`} style={{ 'color': state.color }}>
          {state.message} - Status: {state.status} - Color: {state.color}
        </p>
      )}
      
      <form className="flex flex-col lg:flex-row gap-8" action={formAction}>

        <input type="text" id="gameId" name="gameId" className="hidden" defaultValue={game?.id} />

        <div className="lg:w-80">

          {game?.image ? (
            <img src={`/game/${game?.image}`} alt={game?.title} 
              className="mb-4 rounded-md"
            />
          ) : (
            <p>No image available</p>
          )}

          <div className="mb-4">
            <p className="block mb-2 text-xs text-accent uppercase">
              Upload Thumbnail
            </p>

            <label htmlFor="thumbnailFile"
            className="flex flex-col items-center justify-center w-full h-40 border border-accent
            border-dashed rounded-md cursor-pointer bg-black hover:bg-accent-secondary
            "
            >
              <div className="flex flex-col items-center justify-center p-2">
                <PhotoIcon width={40} height={40} className="mb-4" />
                <p className="mb text-sm">
                  <b>Click to upload</b> or drag and drop
                </p>
                <p className="text-xs">PNG, JPG, WEBP (258x150)</p>
              </div>
              <input
                type="file"
                id="thumbnailFile"
                name="thumbnailFile"
                accept="image/png, image/jpg, image/jpeg, image/webp"
                className="hidden"
              />
            </label>
          </div>


          <div className="mb-4">
            <p className="block mb-2 text-xs text-accent uppercase">
              Upload Game
            </p>

            File: {game?.game_url}

            <label htmlFor="gameFile"
            className="flex flex-col items-center justify-center w-full h-40 border border-accent
            border-dashed rounded-md cursor-pointer bg-black hover:bg-accent-secondary
            "
            >
              <div className="flex flex-col items-center justify-center p-2">
                <ArchiveBoxIcon width={40} height={40} className="mb-4" />
                <p className="mb text-sm">
                  <b>Click to upload</b> or drag and drop
                </p>
                <p className="text-xs">ZIP, RAR, 7zip</p>
              </div>
              <input
                type="file"
                id="gameFile"
                name="gameFile"
                accept=".zip,.rar,.7zip"
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="w-full">
          <div>
            <label htmlFor="title" className="block mb-2 text-xs text-accent uppercase">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="bg-black border border-accent sm:text-sm rounded-lg focus:ring-primary-600
              block w-full p-2 mb-4"
              defaultValue={game?.title}
            />
          </div>

          <div>
            <label htmlFor="slug" className="block mb-2 text-xs text-accent uppercase">
              Slug
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              required
              className="bg-black border border-accent sm:text-sm rounded-lg focus:ring-primary-600
              block w-full p-2 mb-4"
              defaultValue={game?.slug}
            />
          </div>

          <div>
            <label htmlFor="description" className="block mb-2 text-xs text-accent uppercase">
              Description
            </label>
            <textarea
              rows="3"
              cols="50"
              type="text"
              id="description"
              name="description"
              required
              className="bg-black border border-accent sm:text-sm rounded-lg focus:ring-primary-600
              block w-full p-2 mb-4"
              defaultValue={game?.description}
            />
          </div>

          <div>
            <label htmlFor="category" className="block mb-2 text-xs text-accent uppercase">
              Category
            </label>
            <select
              id="category"
              name="category"
              required
              className="bg-black border border-accent sm:text-sm rounded-lg focus:ring-primary-600
              block w-full p-2 mb-4"
              defaultValue={game?.categories[0].id}
            >
            
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category?.id === game?.categories[0].id ? game?.categories[0].title : category?.title}
              </option> 
            ))}

            </select>
          </div>

          <div className="mb-4">
            <p className="block mb-2 text-xs text-accent uppercase">
              Published
            </p>

            <div className="flex gap-4">
              
              <div className="flex gap-2">
                <input type="radio" id="published" name="published" value="true"/>
                <label htmlFor="published">Published</label>
              </div>

              <div className="flex gap-2">
                <input type="radio" id="private" name="published" value="false"/>
                <label htmlFor="private">Private</label>
              </div>
            </div>
            {game?.published ? 'This game was published' : 'This game is not published.'}

          </div>

          <SubmitButton />
        </div>
        
      </form>

      <form action={deleteFormAction} method="post">
        <input type="hidden" name="gameId" value={game?.id} />
        <button type="submit" className="bg-red-600 text-white p-2 rounded-lg text-sm">Delete Game</button>
      </form>

    </div>
  )
}