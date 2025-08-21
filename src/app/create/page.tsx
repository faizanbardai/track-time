'use client'

import { SubmitHandler, useForm } from 'react-hook-form'

type Inputs = {
  title: string
  date: string
  time: string
}

const CreatePage = () => {
  const { register, handleSubmit } = useForm<Inputs>()

  const onSubmit: SubmitHandler<Inputs> = (data) => console.log(data)

  return (
    <div>
      <h1>Create a New Entry</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input {...register('title')} placeholder="Title" />
        <input {...register('date')} type="date" />
        <input {...register('time')} type="time" />
        <button type="submit">Create</button>
      </form>
    </div>
  )
}

export default CreatePage
