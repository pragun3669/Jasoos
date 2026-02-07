package com.example.demo.service;

import com.example.demo.entity.teacher.LastRunCode;
import com.example.demo.repository.teacher.LastRunCodeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class LastRunCodeService {

    private final LastRunCodeRepository repo;

    public LastRunCodeService(LastRunCodeRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public LastRunCode saveOrUpdate(Long studentId, Long testId, Long questionId, String language, String code) {
        Optional<LastRunCode> existing = repo.findByStudentIdAndTestIdAndQuestionId(studentId, testId, questionId);
        LastRunCode lrc;
        if (existing.isPresent()) {
            lrc = existing.get();
            lrc.setCode(code);
            lrc.setLanguage(language);
        } else {
            lrc = new LastRunCode();
            lrc.setStudentId(studentId);
            lrc.setTestId(testId);
            lrc.setQuestionId(questionId);
            lrc.setLanguage(language);
            lrc.setCode(code);
        }
        return repo.save(lrc);
    }

    public Optional<LastRunCode> find(Long studentId, Long testId, Long questionId) {
        return repo.findByStudentIdAndTestIdAndQuestionId(studentId, testId, questionId);
    }

    @Transactional
    public void deleteByStudentAndTest(Long studentId, Long testId) {
        repo.deleteByStudentIdAndTestId(studentId, testId);
    }

    @Transactional
    public void deleteByStudentTestQuestion(Long studentId, Long testId, Long questionId) {
        repo.deleteByStudentIdAndTestIdAndQuestionId(studentId, testId, questionId);
    }
}
