import React, { useCallback, useState, useEffect, FC, FormEvent } from "react";
import { useMutation } from "@apollo/client";
import { addNoticeMutation } from "../../graphql/notice/mutation/add";
import { updateNoticeMutation } from "../../graphql/notice/mutation/update";
import { removeNoticeMutation } from "../../graphql/notice/mutation/remove";
import SetNoticePresenter from "./SetNoticePresenter";
import { useInput, useLazyAxios } from "../../hooks";
import { useVssState, useVssDispatch, HIDE_NOTICE_MODAL } from "../../context";

const SetNoticeContainer: FC = () => {
  const dispatch = useVssDispatch();
  const { activeNotice, isMaster } = useVssState();
  const { loading, call } = useLazyAxios();
  const modalTitle = useInput(activeNotice.title);
  const modalDescription = useInput(activeNotice.description);
  const [mdDescription, setMdDescription] = useState<string>("");
  const [preview, setPreview] = useState<string>("");
  const [modalAction, setModalAction] = useState<any>({
    code: activeNotice.action,
    modalTitle: activeNotice.actionText
  }); // readonly, modifiable, modify, add

  const [set, { loading: setNoticeLoading }] = useMutation(
    activeNotice.noticeId ? updateNoticeMutation : addNoticeMutation
  );

  const [remove, { loading: removeNoticeLoading }] = useMutation(
    removeNoticeMutation
  );

  const convertTextIntoMd = async (text: string) => {
    const { data, error } = await call({
      method: "post",
      url: process.env.MDAPI_PATH,
      data: {
        text,
        mode: "gfm",
        context: "github/gollum"
      }
    });
    if (data) {
      const doc = new DOMParser().parseFromString(data, "text/html");
      return doc.body.innerHTML;
    } else if (error) {
      return null;
    } else {
      throw new Error("please, check useLazyAxios");
    }
  };

  const handlePreView = useCallback(async () => {
    if (loading) return;
    if (!modalDescription.value) {
      return alert("내용을 입력하세요.");
    }
    try {
      const md = await convertTextIntoMd(modalDescription.value);

      if (md) {
        setPreview(md);
      }
    } catch {
      alert("미리보기 로드에 실패했습니다.");
    }
  }, [modalDescription.value]);

  const handleRefreshPreview = useCallback(() => {
    setPreview("");
  }, []);

  const handleClose = useCallback(() => {
    dispatch({
      type: HIDE_NOTICE_MODAL
    });
  }, []);

  const handleShowEdit = useCallback(() => {
    setModalAction({
      code: "modify",
      modalTitle: "수정"
    });
  }, []);

  const handleDelete = useCallback(async () => {
    if (removeNoticeLoading) {
      return alert("요청 중입니다. 잠시만 기다려주세요.");
    }

    const tf = confirm("공지사항을 삭제하시겠어요?");

    if (tf) {
      const {
        data: { deleteNotice }
      } = await remove({
        variables: {
          noticeId: activeNotice.noticeId
        }
      });
      if (deleteNotice) {
        alert("공지사항이 삭제되었습니다.");
        window.location.reload();
      }
    }
  }, [removeNoticeLoading]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (setNoticeLoading) {
        return alert("요청 중입니다. 잠시만 기다려주세요.");
      }

      const tf = confirm(
        `입력한 내용으로 ${
          modalAction.code === "add" ? "등록" : "수정"
        }하시겠어요?`
      );

      if (tf) {
        try {
          const {
            data: { addNotice, updateNotice }
          } = await set({
            variables: {
              title: modalTitle.value,
              description: modalDescription.value,
              noticeId: activeNotice.noticeId
            }
          });
          if (updateNotice) {
            alert("공지사항이 수정되었습니다.");
            window.location.reload();
          } else if (addNotice) {
            alert("공지사항이 등록되었습니다.");
            window.location.reload();
          }
        } catch (error) {
          const { message } = JSON.parse(error.message);
          alert(message);
        }
      }
    },
    [
      modalAction.code,
      modalTitle.value,
      modalDescription.value,
      setNoticeLoading
    ]
  );

  useEffect(() => {
    async function loadDescription(value: string) {
      const md = await convertTextIntoMd(value);
      if (md) {
        setMdDescription(md);
      }
    }
    if (activeNotice.description) {
      loadDescription(activeNotice.description);
    }
  }, [activeNotice.description]);

  return (
    <SetNoticePresenter
      loading={loading}
      removeNoticeLoading={removeNoticeLoading}
      setNoticeLoading={setNoticeLoading}
      action={modalAction}
      isMaster={isMaster}
      title={modalTitle}
      description={modalDescription}
      mdDescription={mdDescription}
      preview={preview}
      onShowEdit={handleShowEdit}
      onPreview={handlePreView}
      onRefreshPreview={handleRefreshPreview}
      onClose={handleClose}
      onDelete={handleDelete}
      onSubmit={handleSubmit}
    />
  );
};

export default SetNoticeContainer;
